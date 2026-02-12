namespace ATMLocator.Core.Settings;

public class ATMSettings
{
    public int InitialReliabilityScore { get; set; } = 50;
    public int MinReliabilityScore { get; set; } = 30;
    public double DefaultSearchRadiusKm { get; set; } = 5.0;
    public double FallbackSearchRadiusKm { get; set; } = 10.0;
    public int WalkingMinutesPerKm { get; set; } = 12;
}
