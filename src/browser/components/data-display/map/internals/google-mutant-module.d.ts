declare module 'leaflet.gridlayer.googlemutant/src/Leaflet.GoogleMutant.mjs' {
  import type {} from 'leaflet.gridlayer.googlemutant';
  import type * as Leaflet from 'leaflet';

  interface GoogleMutantConstructor {
    new (options?: Leaflet.gridLayer.GoogleMutantOptions): Leaflet.GridLayer;
  }

  const GoogleMutant: GoogleMutantConstructor;
  export default GoogleMutant;
}
