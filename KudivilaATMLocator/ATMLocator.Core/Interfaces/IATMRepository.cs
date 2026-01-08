using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IATMRepository
{
    Task<ATM?> GetByIdAsync(string id);
    Task<List<ATM>> GetAllAsync();
    Task<List<ATM>> GetNearbyAsync(double latitude, double longitude, double radiusKm);
    Task<List<ATM>> GetByProvinceAsync(string province);
    Task<List<ATM>> SearchAsync(string searchTerm); // NEW
    Task<List<ATM>> GetByBankNameAsync(string bankName); // NEW
    Task<ATM> CreateAsync(ATM atm);
    Task<ATM> UpdateAsync(ATM atm);
    Task<bool> DeleteAsync(string id);
    Task<bool> AddPhotoAsync(string atmId, string photoUrl); // NEW
}