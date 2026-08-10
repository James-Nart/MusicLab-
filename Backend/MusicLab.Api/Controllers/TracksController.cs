using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicLab.Api.Data;
using MusicLab.Api.Models;

namespace MusicLab.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TracksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;
        private static readonly HttpClient _http = new HttpClient
        {
            Timeout = TimeSpan.FromHours(2)
        };

        private const string PYTHON_SERVICE = "http://localhost:8000";

        public TracksController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private int GetUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(idClaim ?? "0");
        }

        // GET all tracks for current user
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var tracks = await _context.Tracks
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(new { success = true, tracks });
        }

        // GET single track
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var userId = GetUserId();
            var track = await _context.Tracks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (track == null)
                return NotFound(new { success = false, message = "Track not found" });

            return Ok(new { success = true, track });
        }

        // UPLOAD
        [HttpPost("upload")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { success = false, message = "No file uploaded" });

            var validExtensions = new[] { ".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg" };
            var ext = Path.GetExtension(file.FileName).ToLower();
            if (!validExtensions.Contains(ext))
                return BadRequest(new { success = false, message = "Invalid audio file type" });

            var userId = GetUserId();

            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadsDir);

            var uniqueName = $"{Guid.NewGuid()}{ext}";
            var savePath = Path.Combine(uploadsDir, uniqueName);

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var track = new Track
            {
                UserId = userId,
                Name = Path.GetFileNameWithoutExtension(file.FileName),
                OriginalFileName = file.FileName,
                FilePath = savePath,
                FileUrl = $"/uploads/{uniqueName}",
                FileSize = file.Length,
                Status = "uploaded",
                CreatedAt = DateTime.UtcNow
            };

            _context.Tracks.Add(track);
            await _context.SaveChangesAsync();

            return Ok(new UploadTrackResponse
            {
                Success = true,
                Message = "File uploaded successfully",
                Track = track
            });
        }

        // SEPARATE (calls Python service)
        [HttpPost("separate")]
        public async Task<IActionResult> Separate([FromBody] SeparateRequest req)
        {
            var userId = GetUserId();
            var track = await _context.Tracks
                .FirstOrDefaultAsync(t => t.Id == req.TrackId && t.UserId == userId);

            if (track == null)
                return NotFound(new { success = false, message = "Track not found" });

            track.Status = "processing";
            await _context.SaveChangesAsync();

            try
            {
                var pythonReq = new
                {
                    file_path = track.FilePath,
                    track_id = $"track_{track.Id}"
                };

                var response = await _http.PostAsJsonAsync(
                    $"{PYTHON_SERVICE}/separate",
                    pythonReq
                );

                if (!response.IsSuccessStatusCode)
                {
                    track.Status = "failed";
                    await _context.SaveChangesAsync();

                    var errorText = await response.Content.ReadAsStringAsync();
                    return StatusCode(500, new
                    {
                        success = false,
                        message = $"Python service failed: {errorText}"
                    });
                }

                var result = await response.Content.ReadFromJsonAsync<PythonSeparateResponse>();

                if (result == null || !result.Success)
                {
                    track.Status = "failed";
                    await _context.SaveChangesAsync();
                    return StatusCode(500, new { success = false, message = "Separation failed" });
                }

                // Save all URLs
                track.StemsJson = JsonSerializer.Serialize(result.Stems);
                track.ChordsUrl = result.ChordsUrl;
                track.BassNotesUrl = result.BassNotesUrl;
                track.PianoNotesUrl = result.PianoNotesUrl;
                track.Status = "ready";
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Separation complete",
                    track,
                    stems = result.Stems,
                    chordsUrl = result.ChordsUrl,
                    bassNotesUrl = result.BassNotesUrl,
                    pianoNotesUrl = result.PianoNotesUrl
                });
            }
            catch (Exception ex)
            {
                track.Status = "failed";
                await _context.SaveChangesAsync();
                return StatusCode(500, new
                {
                    success = false,
                    message = $"Error: {ex.Message}"
                });
            }
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var track = await _context.Tracks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (track == null)
                return NotFound(new { success = false, message = "Track not found" });

            try
            {
                if (System.IO.File.Exists(track.FilePath))
                    System.IO.File.Delete(track.FilePath);

                var stemsDir = Path.Combine(_env.WebRootPath, "separated", $"track_{track.Id}");
                if (Directory.Exists(stemsDir))
                    Directory.Delete(stemsDir, true);
            }
            catch { /* ignore cleanup errors */ }

            _context.Tracks.Remove(track);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Track deleted" });
        }
    }
}