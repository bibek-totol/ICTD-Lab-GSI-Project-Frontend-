import { useState, useEffect, useMemo, useCallback, memo } from "react";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaBuilding,
  FaLocationArrow,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useTranslation } from "react-i18next";

// Custom marker icon
const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const currentLocationIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/9356/9356230.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to recenter map
const ChangeMapView = memo(({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // Validate center coordinates before setting view
    if (center && Array.isArray(center) && center.length === 2) {
      const [lat, lng] = center;
      // Check if coordinates are valid numbers
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        map.setView(center, zoom, {
          animate: true,
          duration: 1,
        });
      }
    }
  }, [center, zoom, map]);
  return null;
});

// Memoized Lab List Item
const LabListItem = memo(({ lab, index, onSelect }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      onClick={() => onSelect(lab)}
      className="p-3 bg-emerald-950/50 hover:bg-emerald-900/80 rounded-xl border border-emerald-500/20 hover:border-emerald-400 cursor-pointer transition-all shadow-sm hover:shadow-emerald-500/20"
    >
      <h4 className="font-semibold text-sm text-white mb-1 line-clamp-2">
        {lab.institute}
      </h4>
      <div className="flex items-center gap-2 text-xs text-emerald-200/70">
        <FaMapMarkerAlt className="text-emerald-500" />
        <span>{lab.upazila}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-200/70 mt-1">
        <FaUser className="text-blue-400" />
        <span className="line-clamp-1">{lab.head}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-emerald-200/70 mt-1">
        <FaPhone className="text-green-400" />
        <span>{lab.mobile}</span>
      </div>
      {lab.distance && (
        <div className="mt-1 text-xs font-semibold text-emerald-400">
          {t('km_away', { distance: lab.distance.toFixed(2) })}
        </div>
      )}
    </motion.div>
  );
});

const LabDetails = () => {
  const [labType, setLabType] = useState("SOF"); // New state for Lab Type
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distance, setDistance] = useState(5);
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(8);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [address, setAddress] = useState("");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const { t } = useTranslation();

  const isValidCoord = (lat, lng) => {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    return (
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180
    );
  };

  // Static lab images for Lab Information section
  const staticLabImages = [
    "https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC00170-1.avif",
    "https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC00690.avif",
    "https://ucbd.edu.bd/wp-content/uploads/2025/08/ucbdcc2.avif",
    "https://ucbd.edu.bd/wp-content/uploads/2025/08/DSC02243.avif",
  ];

  // Extract unique divisions from labs - Memoized
  const divisions = useMemo(() => {
    const uniqueDivisions = [
      ...new Set(labs.map((lab) => lab.division).filter(Boolean)),
    ];
    return uniqueDivisions.sort();
  }, [labs]);

  const districts = useMemo(() => {
    let filteredForDistricts = labs;
    if (selectedDivision && selectedDivision !== "All") {
      filteredForDistricts = labs.filter(l => l.division === selectedDivision);
    }
    const uniqueDistricts = [
      ...new Set(filteredForDistricts.map((lab) => lab.district).filter(Boolean)),
    ];
    return uniqueDistricts.sort();
  }, [labs, selectedDivision]);

  // Selected Lab Icon (Blue & Pulsing) - Memoized
  const selectedIcon = useMemo(
    () =>
      L.divIcon({
        html: `
            <div class="relative flex items-center justify-center">
                <div class="absolute w-10 h-10 bg-blue-500 rounded-full opacity-40 animate-ping"></div>
                <div class="relative w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-2xl animate-pulse flex items-center justify-center">
                    <div class="w-3 h-3 bg-white rounded-full shadow-inner"></div>
                </div>
                <div class="absolute -bottom-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600"></div>
            </div>
        `,
        className: "custom-selected-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      }),
    [],
  );

  useEffect(() => {
    // Fetch lab data based on selected labType
    const dataFile = labType === "ICTD" ? "/srd-data.json" : "/srd-data300.json";

    fetch(dataFile)
      .then((res) => res.json())
      .then((data) => {
        // Sanitize coordinates and normalize division field
        const sanitizedData = data.map((lab) => {
          let lat = lab.lat;
          let long = lab.long;
          if (Math.abs(lat) > 90) {
            [lat, long] = [long, lat];
          }

          return { ...lab, lat, long };
        }).filter((lab) => isValidCoord(lab.lat, lab.long));

        setLabs(sanitizedData);

        // Reset filters and selection when lab type changes
        setSelectedDivision("All");
        setSelectedDistrict("All");
        setSelectedLab(null);
        setAddress("");

        // Initial filtered labs
        setFilteredLabs(sanitizedData.slice(0, 300));
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, [labType]);


  // Fetch address from coordinates - debounced
  useEffect(() => {
    if (selectedLab && selectedLab.lat && selectedLab.long) {
      setAddress("");
      setIsFetchingAddress(true);

      const timer = setTimeout(() => {
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${selectedLab.lat}&lon=${selectedLab.long}`,
          {
            headers: {
              "User-Agent": "SRD-Lab-Locator/1.0",
            },
          },
        )
          .then((res) => res.json())
          .then((data) => {
            setAddress(data.display_name || "Address not found");
            setIsFetchingAddress(false);
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
            setAddress("Error fetching address");
            setIsFetchingAddress(false);
          });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedLab]);

  // Calculate distance - memoized function
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Get current location
  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        maximumAge: 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = [latitude, longitude];
          setCurrentLocation(location);
          setMapCenter(location);
          setMapZoom(13);
          setSelectedDivision("All"); // Reset division when using location
          setSelectedLab(null); // Reset selected lab
          setAddress(""); // Reset address

          // Filter labs by distance
          const nearby = labs
            .map((lab) => ({
              ...lab,
              distance: calculateDistance(
                latitude,
                longitude,
                lab.lat,
                lab.long,
              ),
            }))
            .filter(
              (lab) =>
                lab.distance <= distance && lab.lat !== 0 && lab.long !== 0,
            )
            .sort((a, b) => a.distance - b.distance);

          setFilteredLabs(nearby);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          let errorMessage = "Unable to get your location.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location services in your browser and system settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "Location information is unavailable. Please check your network connection or GPS.";
              break;
            case error.TIMEOUT:
              errorMessage =
                "The request to get your location timed out. Please try again.";
              break;
            default:
              errorMessage =
                "An unknown error occurred while retrieving location.";
              break;
          }

          toast.error(errorMessage, {
            style: { borderRadius: '10px', background: '#333', color: '#fff' }
          });
          setIsLoadingLocation(false);
        },
        options,
      );
    } else {
      toast.error("Geolocation is not supported by your browser.", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      setIsLoadingLocation(false);
    }
  }, [labs, distance, calculateDistance]);

  // Handle division change
  const handleDivisionChange = useCallback((newDivision) => {
    setSelectedDivision(newDivision);
    setSelectedDistrict("All"); // Reset district when division changes
    setCurrentLocation(null);
    setSelectedLab(null);
    setAddress("");
  }, []);

  const handleDistrictChange = useCallback((newDistrict) => {
    setSelectedDistrict(newDistrict);
    setCurrentLocation(null);
    setSelectedLab(null);
    setAddress("");
  }, []);

  // Filter labs by selected division
  useEffect(() => {
    if (!labs.length) return;

    let filtered = labs;

    // Filter by division
    if (selectedDivision && selectedDivision !== "All") {
      filtered = filtered.filter((lab) => lab.division === selectedDivision);
    }

    // Filter by district
    if (selectedDistrict && selectedDistrict !== "All") {
      filtered = filtered.filter((lab) => lab.district === selectedDistrict);
    }

    // If current location is set, filter by distance
    if (currentLocation) {
      filtered = filtered
        .map((lab) => ({
          ...lab,
          distance: calculateDistance(
            currentLocation[0],
            currentLocation[1],
            lab.lat,
            lab.long,
          ),
        }))
        .filter(
          (lab) => lab.distance <= distance && lab.lat !== 0 && lab.long !== 0,
        )
        .sort((a, b) => a.distance - b.distance);

      // Center map on current location when using distance filter
      setMapCenter(currentLocation);
      setMapZoom(distance <= 5 ? 12 : distance <= 15 ? 10 : 8);
    } else {
      // Limit results for performance
      filtered = filtered
        .filter((lab) => lab.lat !== 0 && lab.long !== 0)
        .slice(0, 400);

      // Calculate center of filtered labs for division-based filtering
      if (filtered.length > 0) {
        const validLabs = filtered.filter(
          (lab) => lab.lat && lab.long && lab.lat !== 0 && lab.long !== 0,
        );
        if (validLabs.length > 0) {
          const avgLat =
            validLabs.reduce((sum, lab) => sum + parseFloat(lab.lat), 0) /
            validLabs.length;
          const avgLong =
            validLabs.reduce((sum, lab) => sum + parseFloat(lab.long), 0) /
            validLabs.length;

          // Validate coordinates before setting
          if (isValidCoord(avgLat, avgLong)) {
            setMapCenter([avgLat, avgLong]);
            // Adjust zoom based on depth of filtering
            let zoom = 7;
            if (selectedDistrict && selectedDistrict !== "All") zoom = 11;
            else if (selectedDivision && selectedDivision !== "All") zoom = 9;
            setMapZoom(zoom);
          } else {
            // Fallback to default Bangladesh center if calculation fails
            setMapCenter([23.8103, 90.4125]);
            setMapZoom(7);
          }
        } else {
          // No valid labs, use default center
          setMapCenter([23.8103, 90.4125]);
          setMapZoom(7);
        }
      } else {
        // No filtered labs, use default center
        setMapCenter([23.8103, 90.4125]);
        setMapZoom(7);
      }
    }

    setFilteredLabs(filtered);
  }, [selectedDivision, selectedDistrict, labs, currentLocation, distance, calculateDistance]);

  // Handle distance change
  const handleDistanceChange = useCallback(
    (newDistance) => {
      setDistance(newDistance);
      if (currentLocation) {
        setSelectedDivision("All");
        setSelectedDistrict("All");
        // Update map zoom based on distance
        setMapZoom(newDistance <= 5 ? 12 : newDistance <= 15 ? 10 : 8);

        const nearby = labs
          .map((lab) => ({
            ...lab,
            distance: calculateDistance(
              currentLocation[0],
              currentLocation[1],
              lab.lat,
              lab.long,
            ),
          }))
          .filter(
            (lab) =>
              lab.distance <= newDistance && lab.lat !== 0 && lab.long !== 0,
          )
          .sort((a, b) => a.distance - b.distance);

        setFilteredLabs(nearby);
      }
    },
    [currentLocation, labs, calculateDistance],
  );

  // Handle lab selection
  const handleLabSelect = useCallback((lab) => {
    setSelectedLab(lab);
    if (lab.lat && lab.long && lab.lat !== 0 && lab.long !== 0) {
      const lat = parseFloat(lab.lat);
      const lng = parseFloat(lab.long);
      // Validate coordinates before setting map center
      if (!isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(15);
      }
    }
  }, []);

  // Memoize visible labs for map (limit to prevent performance issues)
  const visibleMapLabs = useMemo(() => {
    return filteredLabs.slice(0, 300); // Show max 100 markers on map
  }, [filteredLabs]);

  return (
    <div className="min-h-screen bg-emerald-50 pt-3 pb-2 px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[1800px] mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 mt-16"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-2 tracking-tight px-4">
            {t('lab_details_title')}
          </h1>
          <p className="text-emerald-700 max-w-2xl mx-auto px-4">
            {t('lab_details_subtitle')}
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8">
          {/* Left Sidebar - Lab Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4 order-2 lg:order-1"
          >
            <div className="bg-emerald-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/20 p-4 sm:p-6 max-h-auto">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FaBuilding className="text-emerald-400" />
                {t('lab_information')}
              </h2>

              {selectedLab ? (
                <div>
                  {/* Lab Images Gallery */}
                  {selectedLab.labImages && selectedLab.labImages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <p className="text-sm font-semibold text-emerald-200/70 mb-3">
                        ল্যাবের ছবি
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <PhotoProvider>
                          {selectedLab.labImages.map((imgSrc, idx) => (
                            <PhotoView key={idx} src={imgSrc}>
                              <img
                                src={imgSrc}
                                alt={`Lab ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-emerald-500/20"
                                loading="lazy"
                              />
                            </PhotoView>
                          ))}
                        </PhotoProvider>
                      </div>
                    </div>
                  )}

                  {/* Institution Images Gallery */}
                  {selectedLab.institutionImages && selectedLab.institutionImages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-emerald-500/20">
                      <p className="text-sm font-semibold text-emerald-200/70 mb-3">
                        প্রতিষ্ঠানের ছবি
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <PhotoProvider>
                          {selectedLab.institutionImages.map((imgSrc, idx) => (
                            <PhotoView key={idx} src={imgSrc}>
                              <img
                                src={imgSrc}
                                alt={`Institution ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-emerald-500/20"
                                loading="lazy"
                              />
                            </PhotoView>
                          ))}
                        </PhotoProvider>
                      </div>
                    </div>
                  )}

                  {/* Fallback to static images if no uploaded images */}
                  {(!selectedLab.labImages || selectedLab.labImages.length === 0) &&
                    (!selectedLab.institutionImages || selectedLab.institutionImages.length === 0) && (
                      <div className="mt-4 pt-4 border-t border-emerald-500/20">
                        <p className="text-sm font-semibold text-emerald-200/70 mb-3">
                          {t('lab_images')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <PhotoProvider>
                            {staticLabImages.map((imgSrc, idx) => (
                              <PhotoView key={idx} src={imgSrc}>
                                <img
                                  src={imgSrc}
                                  alt={`Lab ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-emerald-500/20"
                                  loading="lazy"
                                />
                              </PhotoView>
                            ))}
                          </PhotoProvider>
                        </div>
                      </div>
                    )}

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-emerald-950/50 rounded-xl p-4 border border-emerald-500/30">
                      <h3 className="font-bold text-lg text-emerald-300 mb-3">
                        {selectedLab.institute}
                      </h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('division')}
                            </p>
                            <p className="text-white">{selectedLab.division}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-emerald-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('district')}
                            </p>
                            <p className="text-white">{selectedLab.district}</p>
                          </div>
                        </div>

                        {selectedLab.seat && (
                          <div className="flex items-start gap-3">
                            <FaMapMarkerAlt className="text-purple-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-emerald-200/70">
                                {t('seat')}
                              </p>
                              <p className="text-white">{selectedLab.seat}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-teal-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('upazila')}
                            </p>
                            <p className="text-white">{selectedLab.upazila}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <FaUser className="text-blue-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('head')}
                            </p>
                            <p className="text-white">{selectedLab.head}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <FaPhone className="text-green-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('phone')}
                            </p>
                            <a
                              href={`tel:${selectedLab.mobile}`}
                              className="text-green-400 hover:text-green-300 font-medium"
                            >
                              {selectedLab.mobile}
                            </a>
                            {selectedLab.alt_mobile && (
                              <p className="text-xs text-emerald-400/70 mt-1">
                                {t('alt_phone')}: {selectedLab.alt_mobile}
                              </p>
                            )}
                          </div>
                        </div>

                        {selectedLab.lab_type && (
                          <div className="flex items-start gap-3">
                            <FaBuilding className="text-indigo-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-emerald-200/70">
                                {t('lab_type')}
                              </p>
                              <p className="text-white uppercase text-xs">
                                {selectedLab.lab_type}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <FaEnvelope className="text-rose-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('email')}
                            </p>
                            <a
                              href={`mailto:${selectedLab.email}`}
                              className="text-rose-400 hover:text-rose-300 text-sm break-all"
                            >
                              {selectedLab.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <FaMapMarkerAlt className="text-orange-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-200/70">
                              {t('address_gps')}
                            </p>
                            {isFetchingAddress ? (
                              <p className="text-emerald-400/50 text-sm animate-pulse">
                                {t('fetching_address')}
                              </p>
                            ) : (
                              <p className="text-white text-sm leading-relaxed">
                                {address || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBuilding className="text-6xl text-emerald-800/50 mx-auto mb-4" />
                  <p className="text-emerald-200/50">
                    {t('click_marker')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Center - Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-6 order-1 lg:order-2"
          >
            <div className="bg-emerald-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/20 h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[calc(100vh-180px)] lg:sticky lg:top-[72px] overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={8}
                className="h-full w-full rounded-2xl"
                zoomControl={true}
              >
                <ChangeMapView center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Current Location Marker */}
                {currentLocation && (
                  <Marker position={currentLocation} icon={currentLocationIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold text-blue-600">Your Location</p>
                        <p className="text-sm text-gray-600">
                          Lat: {currentLocation[0].toFixed(4)}
                          <br />
                          Long: {currentLocation[1].toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Lab Markers - Limited for performance */}
                {visibleMapLabs.map((lab, index) => {
                  // if (lab.lat === 0 || lab.long === 0 || !lab.lat || !lab.long)
                  //   return null;


                  if (!isValidCoord(lab.lat, lab.long)) return null;

                  return (
                    <Marker
                      key={`${lab.institute}-${index}`}
                      position={[lab.lat, lab.long]}
                      icon={
                        selectedLab?.institute === lab.institute
                          ? selectedIcon
                          : customIcon
                      }
                      eventHandlers={{
                        click: () => handleLabSelect(lab),
                      }}
                    />
                  );
                })}
              </MapContainer>
              {filteredLabs.length > 100 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg backdrop-blur-md">
                  Showing 100 of {filteredLabs.length} labs on map
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Sidebar - Controls & Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4 order-3"
          >
            {/* Controls */}
            <div className="bg-emerald-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/20 p-4 sm:p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                {t('filters')}
              </h2>

              {/* Lab Type Selector */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
                  <FaBuilding className="text-emerald-400" />
                  Select Lab Type
                </label>
                <select
                  value={labType}
                  onChange={(e) => setLabType(e.target.value)}
                  className="w-full bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all shadow-sm hover:border-emerald-400"
                >
                  <option value="ICTD" className="bg-emerald-900 text-white">ICTD Lab</option>
                  <option value="SOF" className="bg-emerald-900 text-white">SOF Lab</option>
                </select>
              </div>

              {/* Current Location Button */}
              <button
                onClick={getCurrentLocation}

                disabled={isLoadingLocation}
                className="cursor-pointer hover:scale-105 w-full mb-4 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30"
              >
                <FaLocationArrow
                  className={isLoadingLocation ? "animate-spin" : ""}
                />
                {isLoadingLocation
                  ? t('getting_location')
                  : t('use_current_location')}
              </button>

              <div className="space-y-2 mb-4">
                <label className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-emerald-400" />
                  {t('select_division')}
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all shadow-sm hover:border-emerald-400"
                >
                  <option value="All" className="bg-emerald-900 text-white">
                    {t('all_divisions')}
                  </option>
                  {divisions.map((division) => (
                    <option
                      key={division}
                      value={division}
                      className="bg-emerald-900 text-white"
                    >
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              {/* District Selector */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-emerald-400" />
                  {t('select_district')}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all shadow-sm hover:border-emerald-400"
                >
                  <option value="All" className="bg-emerald-900 text-white">
                    {t('all_districts')}
                  </option>
                  {districts.map((district) => (
                    <option
                      key={district}
                      value={district}
                      className="bg-emerald-900 text-white"
                    >
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* Distance Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-emerald-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-emerald-400" />
                  {t('select_distance')}
                </label>
                <select
                  value={distance}
                  onChange={(e) => handleDistanceChange(Number(e.target.value))}
                  className={`w-full ${!currentLocation ? "opacity-50 cursor-not-allowed" : ""
                    } bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 outline-none transition-all shadow-sm hover:border-emerald-400`}
                  disabled={!currentLocation}
                >
                  {[1, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50].map((km) => (
                    <option
                      key={km}
                      value={km}
                      className="bg-emerald-900 text-white"
                    >
                      {km} km
                    </option>
                  ))}
                </select>
                {!currentLocation && (
                  <p className="text-xs text-emerald-400/70 italic">
                    {t('enable_location_filter')}
                  </p>
                )}
              </div>

              {/* Results Count */}
              <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <p className="text-sm font-semibold text-emerald-300">
                  {t('found_labs', { count: filteredLabs.length })}
                </p>
              </div>
            </div>

            {/* Nearby Labs List */}
            <div className="bg-emerald-900 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-500/20 p-4 sm:p-6 max-h-[420px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xl font-bold text-white mb-4">{t('nearby_labs')}</h3>

              <div className="space-y-3">
                {filteredLabs.map((lab, index) => (
                  <LabListItem
                    key={`${lab.institute}-${index}`}
                    lab={lab}
                    index={index}
                    onSelect={handleLabSelect}
                  />
                ))}

                {filteredLabs.length === 0 && (
                  <div className="text-center py-8">
                    <FaMapMarkerAlt className="text-4xl text-emerald-800/50 mx-auto mb-2" />
                    <p className="text-emerald-200/50 text-sm">
                      {t('no_labs_found')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LabDetails;
