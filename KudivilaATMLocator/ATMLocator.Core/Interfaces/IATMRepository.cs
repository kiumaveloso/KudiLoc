using ATMLocator.Core.Entities;

namespace ATMLocator.Core.Interfaces;

public interface IATMRepository
{
    Task<ATM?> GetByIdAsync(string id);
    Task<List<ATM>> GetAllAsync();
    Task<List<ATM>> GetNearbyAsync(double latitude, double longitude, double radiusKm);
    Task<List<ATM>> GetByProvinceAsync(string province, int skip = 0, int limit = 20);
    Task<long> CountByProvinceAsync(string province);
    Task<List<ATM>> SearchAsync(string searchTerm, int skip = 0, int limit = 20);
    Task<long> CountSearchAsync(string searchTerm);
    Task<List<ATM>> GetByBankNameAsync(string bankName, int skip = 0, int limit = 20);
    Task<long> CountByBankNameAsync(string bankName);
    Task<long> CountAllAsync();
    Task<ATM> CreateAsync(ATM atm);
    Task<ATM> UpdateAsync(ATM atm);
    Task<bool> DeleteAsync(string id);
    Task<bool> AddPhotoAsync(string atmId, string photoUrl); // NEW
}