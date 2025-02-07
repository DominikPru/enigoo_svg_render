export enum renderTypes {
  SECTOR = 'sector',
  SEAT = 'seat',
}
export interface MapInfo {
  id: number;
  name: string;
  text: {
    cs: string;
    de: string;
    en: string;
  };
  description: string;
  place: string;
  image: string;
  onlineClose: string;
  startTime: string;
  endTime: string;
  type: number;
  playoff: string;
  limit: number;
  boughtLimit: string;
  dsc: string;
}

export interface Category {}

export interface Coords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MAP_SVG {
  x: number;
  y: number;
  uuid: string;
  data: string;
  width: number;
  height: number;
}
export interface Data {
  cords: Coords;
  rows: Row[];
  texts: Text[];
  svgs: MAP_SVG[];
  shapes: Shape[] | [];
}

export interface BaseInput {
  type: number;
  info: MapInfo;
  categories: Category[] | [];
  data: Data;
  svg: string;
}

export enum FontStyle {
  BOLD = 'bold',
}

export interface Shape {}
export interface Text {
  x: number;
  y: number;
  x2: number;
  y2: number;
  text: string;
  uuid: string;
  color: string;
  fontsize: number;
  rotation: number;
  fontstyle: FontStyle;
}

export interface Row {
  label: number;
  sector: string;
  uuid: string;
  showLeft: boolean;
  showRight: boolean;
  seats: Seat[];
}

export interface SeatCategory {
  id: number;
  color: string;
  textColor: string;
}
export interface Seat {
  id: number | undefined;
  uuid: string;
  x: number;
  y: number;
  isSpaceRight: false | undefined;
  isSpaceLeft: false | undefined;
  isRowLabel: boolean | undefined | 'left' | 'right';
  blocked: boolean | undefined;
  price: number | undefined;
  sector: string | undefined;
  row: number | undefined;
  place: number | undefined;
  prePurchase: boolean | undefined;
  category: SeatCategory | undefined;
}

export interface DrawablePlaceProps {
  containerDimensions: { height: number; width: number };
}
