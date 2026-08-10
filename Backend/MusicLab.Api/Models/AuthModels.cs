namespace MusicLab.Api.Models
{
    // 1. This class represents a row in our Database Table
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        // SECURITY NOTE: We store encrypted passwords here, not real text!
        public string PasswordHash { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    // 2. What React sends when Logging In
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    
    // 3. What React sends when Creating an Account (extends Login)
    public class RegisterRequest : LoginRequest 
    {
        public string Name { get; set; } = "Musician";
    }

    // 4. What C# sends BACK to React after success/failure
    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; } 
        public string? UserName { get; set; }
    }
    
    public class GoogleLoginRequest
    {
        public string AccessToken { get; set; } = string.Empty;
    }

    public class GoogleUserInfo
    {
        public string Sub { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Picture { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("email_verified")]
        public bool EmailVerified { get; set; }
    }

    // ============================================================
    // TRACK MODEL — represents a user's uploaded song
    // ============================================================
    public class Track
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public double Duration { get; set; }
        public string Status { get; set; } = "uploaded";
        public string? StemsJson { get; set; }
        public string? ChordsUrl { get; set; }        // NEW
        public string? BassNotesUrl { get; set; }     // NEW
        public string? PianoNotesUrl { get; set; }    // NEW
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class UploadTrackResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Track? Track { get; set; }
    }

    public class SeparateRequest
    {
        public int TrackId { get; set; }
        public List<string> Instruments { get; set; } = new();
    }

public class PythonStemInfo
{
    [System.Text.Json.Serialization.JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}

public class PythonSeparateResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("track_id")]
    public string TrackId { get; set; } = string.Empty;

    public List<PythonStemInfo> Stems { get; set; } = new();

    [System.Text.Json.Serialization.JsonPropertyName("chords_url")]
    public string? ChordsUrl { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("bass_notes_url")]
    public string? BassNotesUrl { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("piano_notes_url")]
    public string? PianoNotesUrl { get; set; }
}
}