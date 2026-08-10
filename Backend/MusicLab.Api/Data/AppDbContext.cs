using Microsoft.EntityFrameworkCore;
using MusicLab.Api.Models;

namespace MusicLab.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users => Set<User>();
        public DbSet<Track> Tracks => Set<Track>();
    }
}