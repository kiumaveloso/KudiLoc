import React, { useState, useMemo } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, LocateFixed } from "lucide-react";
import ATMMarker from "@/components/map/ATMMarker";
import SearchHeader from "@/components/map/SearchHeader";
import UserLocationMarker from "@/components/map/UserLocationMarker";
import ATMBottomSheet from "@/components/map/ATMBottomSheet";
import AddATMModal from "@/components/map/AddATMModal";
import PullToRefresh from "@/components/map/PullToRefresh";
import "leaflet/dist/leaflet.css";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedATM, setSelectedATM] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const queryClient = useQueryClient();

  const { data: atms = [] } = useQuery({
    queryKey: ["atms"],
    queryFn: () => base44.entities.ATM.list("-updated_date", 200),
  });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["atms"] });
  };

  const filteredATMs = useMemo(() => {
    let result = atms;
    if (activeFilter === "favorites") {
      const favs = (() => { try { return JSON.parse(localStorage.getItem("kudi_favorites") || "[]"); } catch { return []; } })();
      result = result.filter((a) => favs.includes(a.id));
    } else if (activeFilter !== "all") {
      result = result.filter((a) => a.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.bank_name?.toLowerCase().includes(q) ||
          a.location_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [atms, activeFilter, searchQuery]);

  const handleLocateMe = () => {
    if (userLocation && mapRef) {
      mapRef.setView(userLocation, 16);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(latlng);
        if (mapRef) mapRef.setView(latlng, 16);
      });
    }
  };

  const defaultCenter = [-8.8383, 13.2344];

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="relative flex-1 flex flex-col">
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />

      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="w-full h-full absolute inset-0"
          zoomControl={false}
          ref={setMapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <ZoomControl position="bottomleft" />
          <UserLocationMarker onLocation={setUserLocation} />
          {filteredATMs.map((atm) => (
            <ATMMarker key={atm.id} atm={atm} onSelect={setSelectedATM} />
          ))}
        </MapContainer>
      </div>

      {/* ATM counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-[#10B981] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {filteredATMs.length} ATMs
        </div>
      </div>

      {/* Locate me button */}
      <button
        onClick={handleLocateMe}
        className="absolute bottom-20 right-4 z-[1000] w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <LocateFixed className="w-5 h-5 text-[#10B981]" />
      </button>

      {/* Add ATM FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="absolute bottom-6 right-4 z-[1000] w-14 h-14 bg-[#10B981] rounded-2xl shadow-xl flex items-center justify-center hover:bg-[#059669] transition-colors active:scale-95"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* ATM Bottom Sheet */}
      {selectedATM && (
        <ATMBottomSheet
          atm={selectedATM}
          onClose={() => setSelectedATM(null)}
        />
      )}

      {/* Add ATM Modal */}
      {showAddModal && (
        <AddATMModal
          userLocation={userLocation}
          onClose={() => setShowAddModal(false)}
        />
      )}
      </div>
    </PullToRefresh>
  );
}