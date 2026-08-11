export type TransitStep = {
  lineName: string;
  vehicleType: string;
  departureStop: string;
  arrivalStop: string;
  departureTime: string | null;
  arrivalTime: string | null;
};

export type TransitRoute = {
  mode: "transit";
  durationText: string;
  durationValue: number;
  arrivalTimeText: string | null;
  fareText: string | null;
  steps: TransitStep[];
};

export type DrivingRoute = {
  mode: "driving";
  durationText: string;
  durationValue: number;
  durationInTrafficText: string | null;
  durationInTrafficValue: number | null;
  distanceText: string;
};

export type RouteResult = TransitRoute | DrivingRoute;

export type DelayStatus = "normal" | "delay" | "unmapped" | "unknown";

export type LineDelay = {
  lineName: string;
  status: DelayStatus;
  text: string | null;
};
