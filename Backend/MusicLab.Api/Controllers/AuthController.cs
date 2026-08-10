using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MusicLab.Api.Data;
using MusicLab.Api.Models;

namespace MusicLab.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _config = configuration;
        }

        // =========================================================
        // ENDPOINT 1: REGISTER USER
        // URL: POST http://localhost:5100/api/auth/register
        // =========================================================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            if (req == null)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid registration request."
                });
            }

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                });
            }

            if (req.Password.Length < 6)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Password must be at least 6 characters."
                });
            }

            var email = req.Email.Trim().ToLower();

            var exists = await _context.Users.AnyAsync(u => u.Email == email);

            if (exists)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Email is already registered."
                });
            }

            var displayName = string.IsNullOrWhiteSpace(req.Name)
                ? email.Split('@')[0]
                : req.Name.Trim();

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(req.Password);

            var newUser = new User
            {
                Name = displayName,
                Email = email,
                PasswordHash = hashedPassword,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(newUser);
            await _context.SaveChangesAsync();

            var token = GenerateToken(newUser);

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                UserName = newUser.Name
            });
        }

        // =========================================================
        // ENDPOINT 2: LOGIN USER
        // URL: POST http://localhost:5100/api/auth/login
        // =========================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (req == null)
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid login request."
                });
            }

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                });
            }

            var email = req.Email.Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password."
                });
            }

            var passwordIsValid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);

            if (!passwordIsValid)
            {
                return Unauthorized(new AuthResponse
                {
                    Success = false,
                    Message = "Invalid email or password."
                });
            }

            var token = GenerateToken(user);

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                UserName = string.IsNullOrWhiteSpace(user.Name)
                    ? user.Email.Split('@')[0]
                    : user.Name
            });
        }

        // =========================================================
        // ENDPOINT 3: GOOGLE LOGIN / SIGNUP
        // URL: POST http://localhost:5100/api/auth/google-login
        //
        // React sends:
        // {
        //   "accessToken": "google_access_token_here"
        // }
        // =========================================================
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.AccessToken))
            {
                return BadRequest(new AuthResponse
                {
                    Success = false,
                    Message = "Google access token is missing."
                });
            }

            try
            {
                using var client = new HttpClient();

                var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    "https://www.googleapis.com/oauth2/v3/userinfo"
                );

                request.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", req.AccessToken);

                var googleResponse = await client.SendAsync(request);

                if (!googleResponse.IsSuccessStatusCode)
                {
                    return Unauthorized(new AuthResponse
                    {
                        Success = false,
                        Message = "Invalid Google token."
                    });
                }

                var googleUser =
                    await googleResponse.Content.ReadFromJsonAsync<GoogleUserInfo>();

                if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
                {
                    return Unauthorized(new AuthResponse
                    {
                        Success = false,
                        Message = "Could not retrieve Google user information."
                    });
                }

                if (!googleUser.EmailVerified)
                {
                    return Unauthorized(new AuthResponse
                    {
                        Success = false,
                        Message = "Google email is not verified."
                    });
                }

                var email = googleUser.Email.Trim().ToLower();
                var displayName = string.IsNullOrWhiteSpace(googleUser.Name)
                    ? email.Split('@')[0]
                    : googleUser.Name.Trim();

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

                // If Google user does not exist in our database, create them
                if (user == null)
                {
                    user = new User
                    {
                        Name = displayName,
                        Email = email,

                        // Google users do not need password login.
                        // We store a random hashed password just to satisfy the database field.
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),

                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.Users.AddAsync(user);
                    await _context.SaveChangesAsync();
                }
                else if (string.IsNullOrWhiteSpace(user.Name))
                {
                    user.Name = displayName;
                    await _context.SaveChangesAsync();
                }

                var token = GenerateToken(user);

                return Ok(new AuthResponse
                {
                    Success = true,
                    Message = "Google login successful",
                    Token = token,
                    UserName = user.Name
                });
            }
            catch
            {
                return StatusCode(500, new AuthResponse
                {
                    Success = false,
                    Message = "Google login failed. Please try again."
                });
            }
        }

        // =========================================================
        // HELPER METHOD: GENERATE JWT TOKEN
        // =========================================================
        private string GenerateToken(User user)
        {
            var secretKey = _config["JwtSettings:SecretKey"];

            if (string.IsNullOrWhiteSpace(secretKey))
            {
                throw new Exception("JWT secret key is missing in appsettings.json");
            }

            var keyBytes = Encoding.UTF8.GetBytes(secretKey);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(keyBytes),
                SecurityAlgorithms.HmacSha256
            );

            var issuer = _config["JwtSettings:Issuer"];
            var audience = _config["JwtSettings:Audience"];

            var expirationInHoursText = _config["JwtSettings:ExpirationInHours"];

            var expirationInHours = double.TryParse(expirationInHoursText, out var hours)
                ? hours
                : 24;

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expirationInHours),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
