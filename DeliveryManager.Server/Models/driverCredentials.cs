﻿namespace DeliveryManager.Server.Models
{
    public class driverCredentials
    {
        public string? USERNAME { get; set; }

        public string? PASSWORD { get; set; }

        public string? POWERUNIT { get; set; }
    }

    public class driverVerification
    {
        public string USERNAME { get; set; }
        public string PASSWORD { get; set; }
        public string POWERUNIT { get; set; }
        public string MFSTDATE { get; set; }
    }
}
