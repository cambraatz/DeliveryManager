using System.IO;
using System.Runtime.CompilerServices;
using DeliveryManager.Server.Models;

namespace DeliveryManager.Server.Services
{
    public class LoggingService
    {
        private readonly ILogger _logger;
        public LoggingService(ILogger logger) 
        { 
            _logger = logger; 
        }
        private void LogException(Exception ex, 
            string exMessage, 
            [CallerMemberName] string memberName = "",
            [CallerFilePath] string filePath = "",
            [CallerLineNumber] int lineNumber = 0)
        {
            string log = $"{exMessage} [@ {memberName} in {System.IO.Path.GetFileName(filePath)}: line {lineNumber}]";
            _logger.LogError(ex,log);
        }

        public CallerData CallerLocation(
            [CallerMemberName] string member = "",
            [CallerFilePath] string filePath = "",
            [CallerLineNumber] int lineNumber = 0)
        {
            return new CallerData
            {
                member = member, 
                filePath = Path.GetFileName(filePath), 
                lineNumber  = lineNumber.ToString()
            };
        }
    }
}
