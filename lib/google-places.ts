const API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export type AddressPrediction = {
  placeId: string;
  description: string;
};

export type AddressDetails = {
  placeId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat: number;
  lng: number;
};

export async function autocompleteAddress(
  query: string
): Promise<AddressPrediction[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json"
  );
  url.searchParams.set("input", query);
  url.searchParams.set("types", "address");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places autocomplete failed: ${data.status}`);
  }

  return (data.predictions ?? []).map((p: { place_id: string; description: string }) => ({
    placeId: p.place_id,
    description: p.description,
  }));
}

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

function findComponent(components: AddressComponent[], type: string) {
  return components.find((c) => c.types.includes(type));
}

export async function getAddressDetails(
  placeId: string
): Promise<AddressDetails> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "address_component,geometry,formatted_address");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places details failed: ${data.status}`);
  }

  const components: AddressComponent[] = data.result.address_components ?? [];
  const streetNumber = findComponent(components, "street_number")?.long_name ?? "";
  const route = findComponent(components, "route")?.long_name ?? "";
  const city =
    findComponent(components, "locality")?.long_name ??
    findComponent(components, "sublocality")?.long_name ??
    "";
  const state = findComponent(components, "administrative_area_level_1")?.short_name ?? "";
  const postalCode = findComponent(components, "postal_code")?.long_name ?? "";
  const country = findComponent(components, "country")?.long_name ?? "";

  return {
    placeId,
    addressLine1: [streetNumber, route].filter(Boolean).join(" "),
    city,
    state,
    postalCode,
    country,
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
  };
}
