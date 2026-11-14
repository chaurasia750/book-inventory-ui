export interface Country {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CountryListResponse {
  items: Country[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CountryFilterModel {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  sortingOrder?: number;
  colName?: string;
  active?: boolean;
}

export interface CountryPayload {
  name: string;
  isActive: boolean;
}

export interface UpdateCountryStatusPayload {
  cActive: boolean;
}

export interface State {
  id: number;
  name: string;
  cid: number;
  countryName: string;
  isActive: boolean;
}

export interface StateListResponse {
  items: State[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface StatePayload {
  name: string;
  cid: number;
  isActive: boolean;
}

export interface StateFilterModel {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  sortingOrder?: number;
  colName?: string;
  cid?: number;
  sActive?: boolean;
}

export interface UpdateStateStatusPayload {
  sActive: boolean;
}

export interface District {
  id: number;
  name: string;
  cid: number;
  countryName: string;
  sid: number;
  stateName: string;
  isActive: boolean;
}

export interface DistrictListResponse {
  items: District[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface DistrictPayload {
  name: string;
  cid: number;
  sid: number;
  isActive: boolean;
}

export interface DistrictFilterModel {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  sortingOrder?: number;
  colName?: string;
  cid?: number;
  sid?: number;
  active?: boolean;
}

export interface UpdateDistrictStatusPayload {
  active: boolean;
}

export interface City {
  id: number;
  cityName: string;
  pincode: string;
  cid: number;
  countryName: string;
  sid: number;
  stateName: string;
  distId: number;
  districtName: string;
  isActive: boolean;
}

export interface CityListResponse {
  items: City[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CityFilterModel {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  sortingOrder?: number;
  colName?: string;
  cid?: number;
  sid?: number;
  distId?: number;
  active?: boolean;
}

export interface UpdateCityPayload {
  cityName: string;
  pincode: string;
  active: boolean;
}
