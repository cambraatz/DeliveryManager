using DeliveryManager.Server.Services;
using DeliveryManager.Server.Services.Interfaces;

using Newtonsoft.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;

// token initialization...
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using Serilog;

// new modification to CORS package...
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

var logPath = builder.Environment.IsProduction()
    ? Path.Combine(builder.Environment.ContentRootPath, "Logs", "logs.log")
    : "logs.log";

Log.Logger = new LoggerConfiguration()
    .WriteTo.File(logPath, rollingInterval: RollingInterval.Day)
    //.WriteTo.File("/var/www/deliverymanager/log/logs.log", rollingInterval: RollingInterval.Day)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

if (builder.Environment.IsProduction())
{
    builder.WebHost.ConfigureKestrel(options =>
    {
        options.ListenAnyIP(5000);
    });

    // new modification to CORS package...
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(name: MyAllowSpecificOrigins,
            policy =>
            {
                policy.SetIsOriginAllowed(origin => new Uri(origin).Host.EndsWith("tcsservices.com"))
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });
} 
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(name: MyAllowSpecificOrigins,
            policy =>
            {
                policy.WithOrigins("https://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
    });
}

// Add services to the container.
//builder.Services.AddControllers();

// Adding Serializers, this is a new attempt...
// JSON Serializer
builder.Services.AddControllers().AddNewtonsoftJson(options =>
options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore).AddNewtonsoftJson(
    options => options.SerializerSettings.ContractResolver = new DefaultContractResolver());


// token initialization...
//var jwtKey = Environment.GetEnvironmentVariable("Jwt__Key") ?? builder.Configuration["Jwt:Key"];
builder.Services.AddAuthentication(options => 
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// var app = builder.Build();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICookieService, CookieService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMappingService, MappingService>();
builder.Services.AddScoped<IDeliveryService, DeliveryService>();
builder.Services.AddScoped<IDeliveryListService, DeliveryListService>();

/*var app = builder.Build();

app.UseRouting();

app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
    HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always,
    Secure = app.Environment.IsProduction() || (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Kestrel:Certificates:Default:Password:IsTrusted", false))
        ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest
});

app.UseAuthentication();
app.UseAuthorization();

app.UseCors(MyAllowSpecificOrigins);

if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
}


app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();*/

var app = builder.Build();

// Error Handling (very early)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Only in Dev
}
else
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Forwarded Headers (if behind a proxy like Nginx in Production)
if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
}

app.UseHttpsRedirection(); // Redirects HTTP to HTTPS

// Swagger UI (typically before Routing in Development)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting(); // Identifies endpoints

// CORS (after UseRouting, before Auth/AuthZ)
app.UseCors(MyAllowSpecificOrigins);

// Cookie Policy (usually before Auth)
app.UseCookiePolicy(new CookiePolicyOptions
{
    MinimumSameSitePolicy = SameSiteMode.None,
    HttpOnly = Microsoft.AspNetCore.CookiePolicy.HttpOnlyPolicy.Always,
    Secure = app.Environment.IsProduction() || (app.Environment.IsDevelopment() && app.Configuration.GetValue<bool>("Kestrel:Certificates:Default:Password:IsTrusted", false))
        ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest
});

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

// Static Files for the SPA
app.UseDefaultFiles(); // Serves default.html, index.html etc. for the SPA
app.UseStaticFiles(); // Serves JS, CSS, images etc. for the SPA

app.MapControllers(); // Maps your API controller endpoints

// Fallback for SPA routing (must be last)
app.MapFallbackToFile("/index.html");

app.Run();

