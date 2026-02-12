namespace ATMLocator.Core.Settings;

public class ReportSettings
{
    public int ReportTimeWindowMinutes { get; set; } = 30;
    public int MinConfirmationsForTrust { get; set; } = 3;
    public int CooldownMinutes { get; set; } = 5;
    public int ReputationGainOnConsensus { get; set; } = 2;
    public int ReputationLossOnDisagreement { get; set; } = 3;
    public int ConsensusCheckWindowMinutes { get; set; } = 5;
}
