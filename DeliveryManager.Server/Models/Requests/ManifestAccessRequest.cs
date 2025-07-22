using System.Globalization;

namespace DeliveryManager.Server.Models.Requests
{
    // DTO for Manifest Access Request
    public class ManifestAccessRequest
    {
        public string PowerUnit { get; set; } = string.Empty;

        // This property will receive the string in "MMDDYYYY" format from the client
        public string MfstDateString { get; set; } = string.Empty;

        // This computed property will attempt to parse the string into a DateTime
        public DateTime MfstDate
        {
            get
            {
                // CHANGE THIS LINE: Use "yyyy-MM-dd" as the expected format
                if (DateTime.TryParseExact(MfstDateString, "yyyy-MM-dd",
                                           CultureInfo.InvariantCulture,
                                           DateTimeStyles.None, // Use None for exact parsing without extra components
                                           out DateTime parsedDate))
                {
                    return parsedDate;
                }
                // Log a warning here in the DTO if you want, or just let the controller handle it.
                // For robustness, returning default(DateTime) is fine, as the controller checks for it.
                return default(DateTime); // Returns DateTime.MinValue if parsing fails
            }
        }
    }
}
