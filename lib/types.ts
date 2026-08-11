export type DrivingRoute = {
  mode: "driving";
  durationText: string;
  durationValue: number;
  durationInTrafficText: string | null;
  durationInTrafficValue: number | null;
  distanceText: string;
  overviewPolyline: string;
};
