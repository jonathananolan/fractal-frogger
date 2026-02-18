// Vehicle sprite metadata
// All sprites are 48px wide; length (px) varies by vehicle size

import { Assets } from "pixi.js";
import { SpriteData } from "../shared/types";

export const SPRITE_PATH = "/sprites/";

export const VEHICLE_SPRITES: SpriteData[] = [
  // Short (48px)
  { file: "Vehicle_Armed_Land_Roamer.png", length: 48 },
  { file: "Vehicle_Dementia.png", length: 48 },
  { file: "Vehicle_Land_Roamer.png", length: 48 },

  // Medium (64px)
  { file: "Vehicle_A-Type.png", length: 64 },
  { file: "Vehicle_Aniston_BD4.png", length: 64 },
  { file: "Vehicle_Arachnid.png", length: 64 },
  { file: "Vehicle_B-Type.png", length: 64 },
  { file: "Vehicle_Beamer.png", length: 64 },
  { file: "Vehicle_Benson.png", length: 64 },
  { file: "Vehicle_Big_Bug.png", length: 64 },
  { file: "Vehicle_Bug.png", length: 64 },
  { file: "Vehicle_Bulwark.png", length: 64 },
  { file: "Vehicle_Cop_Car.png", length: 64 },
  { file: "Vehicle_Eddy.png", length: 64 },
  { file: "Vehicle_Furore_GT.png", length: 64 },
  { file: "Vehicle_GT-A1.png", length: 64 },
  { file: "Vehicle_Hachura.png", length: 64 },
  { file: "Vehicle_Jagular_XK.png", length: 64 },
  { file: "Vehicle_Jefferson.png", length: 64 },
  { file: "Vehicle_Maurice.png", length: 64 },
  { file: "Vehicle_Meteor.png", length: 64 },
  { file: "Vehicle_Miara.png", length: 64 },
  { file: "Vehicle_Michelli_Roadster.png", length: 64 },
  { file: "Vehicle_Minx.png", length: 64 },
  { file: "Vehicle_Morton.png", length: 64 },
  { file: "Vehicle_Panto.png", length: 64 },
  { file: "Vehicle_Pickup.png", length: 64 },
  { file: "Vehicle_Pickup_(Redneck).png", length: 64 },
  { file: "Vehicle_Romero.png", length: 64 },
  { file: "Vehicle_Rumbler.png", length: 64 },
  { file: "Vehicle_Schmidt.png", length: 64 },
  { file: "Vehicle_Shark.png", length: 64 },
  { file: "Vehicle_Special_Agent_Car.png", length: 64 },
  { file: "Vehicle_Spritzer.png", length: 64 },
  { file: "Vehicle_Stinger.png", length: 64 },
  { file: "Vehicle_T-Rex.png", length: 64 },
  { file: "Vehicle_Taxi.png", length: 64 },
  { file: "Vehicle_Taxi_Xpress.png", length: 64 },
  { file: "Vehicle_Trance-Am.png", length: 64 },
  { file: "Vehicle_Truck_Cab.png", length: 64 },
  { file: "Vehicle_Truck_Cab_SX.png", length: 64 },
  { file: "Vehicle_U-Jerk_Truck.png", length: 64 },
  { file: "Vehicle_Wellard.png", length: 64 },
  { file: "Vehicle_Z-Type.png", length: 64 },

  // Large (96px)
  { file: "Vehicle_Dementia_Limousine.png", length: 96 },
  { file: "Vehicle_G4_Bank_Van.png", length: 96 },
  { file: "Vehicle_Garbage_Truck.png", length: 96 },
  { file: "Vehicle_Hot_Dog_Van.png", length: 96 },
  { file: "Vehicle_Ice-Cream_Van.png", length: 96 },
  { file: "Vehicle_Medicar.png", length: 96 },
  { file: "Vehicle_Pacifier.png", length: 96 },
  { file: "Vehicle_SWAT_Van.png", length: 96 },
  { file: "Vehicle_Tank.png", length: 96 },
  { file: "Vehicle_Tow_Truck.png", length: 96 },
  { file: "Vehicle_Van.png", length: 96 },

  // Extra-long (128px)
  { file: "Vehicle_Box_Car.png", length: 128 },
  { file: "Vehicle_Box_Truck.png", length: 128 },
  { file: "Vehicle_Bus.png", length: 128 },
  { file: "Vehicle_Container.png", length: 128 },
  { file: "Vehicle_Fire_Truck.png", length: 128 },
  { file: "Vehicle_Karma_Bus.png", length: 128 },
  { file: "Vehicle_Sports_Limousine.png", length: 128 },
  { file: "Vehicle_Stretch_Limousine.png", length: 128 },
  { file: "Vehicle_Train.png", length: 128 },
  { file: "Vehicle_Train_Cab.png", length: 128 },
  { file: "Vehicle_Train_FB.png", length: 128 },
  { file: "Vehicle_Transporter.png", length: 128 },
];

/** Load all vehicle sprite textures. Call once at startup. */
export async function loadVehicleSprites(): Promise<void> {
  await Assets.load(VEHICLE_SPRITES.map((s) => SPRITE_PATH + s.file));
}

export const VEHICLES_BY_SIZE: Record<VehicleSize, SpriteData[]> = {
  s: VEHICLE_SPRITES.filter((s) => s.length === 48),
  m: VEHICLE_SPRITES.filter((s) => s.length === 64),
  l: VEHICLE_SPRITES.filter((s) => s.length === 96),
  xl: VEHICLE_SPRITES.filter((s) => s.length === 128),
};
