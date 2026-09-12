export interface CustomerAddress {
  house_street: string;
  landmark?: string | null;
  village_town_city: string;
  post_office?: string | null;
  district: string;
  state: string;
  pincode: string;
}

export function emptyAddress(): CustomerAddress {
  return {
    house_street: "",
    landmark: "",
    village_town_city: "",
    post_office: "",
    district: "",
    state: "",
    pincode: "",
  };
}
