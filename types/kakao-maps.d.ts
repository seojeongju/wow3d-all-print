/** 카카오 지도 JavaScript SDK (필요한 최소 타입만 선언) */
declare namespace kakao.maps {
    function load(callback: () => void): void

    class LatLng {
        constructor(lat: number, lng: number)
        getLat(): number
        getLng(): number
    }

    class Map {
        constructor(container: HTMLElement, options: { center: LatLng; level: number })
        setCenter(latlng: LatLng): void
        setLevel(level: number): void
        relayout(): void
    }

    class Marker {
        constructor(options: { position: LatLng; map?: Map })
        setMap(map: Map | null): void
        setPosition(latlng: LatLng): void
    }

    class InfoWindow {
        constructor(options: { content: string; removable?: boolean })
        open(map: Map, marker: Marker): void
        close(): void
    }

    namespace event {
        function addListener(target: object, type: string, handler: () => void): void
        function removeListener(target: object, type: string, handler: () => void): void
    }

    namespace services {
        enum Status {
            OK = 'OK',
            ZERO_RESULT = 'ZERO_RESULT',
            ERROR = 'ERROR',
        }

        class Geocoder {
            addressSearch(
                address: string,
                callback: (
                    result: Array<{ x: string; y: string; address_name: string }>,
                    status: Status,
                ) => void,
            ): void
        }
    }
}

interface Window {
    kakao?: {
        maps: typeof kakao.maps
    }
}
