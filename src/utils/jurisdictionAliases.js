const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const findBnName = (items, value) => {
  if (!value) return null;
  const target = normalize(value);
  const match = items.find(
    (item) => normalize(item.name) === target || normalize(item.bn_name) === target,
  );

  return match?.bn_name || value;
};

const API = import.meta.env.VITE_API_BASE_URL || 'https://ictd-lab-backend.vercel.app/api/v1';

const fetchJson = async (path) => {
  const response = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
};

export const getBanglaJurisdictionNames = async ({ division, district, upazila }) => {
  const [divisionData, districtData, upazilaData] = await Promise.all([
    fetchJson('/data/divisions'),
    fetchJson('/data/districts'),
    fetchJson('/data/upazilas'),
  ]);

  return {
    division: findBnName(divisionData.divisions || [], division),
    district: findBnName(districtData.districts || [], district),
    upazila: findBnName(upazilaData.upazilas || [], upazila),
  };
};
