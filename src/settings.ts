
export const systemId = "launch2023"
export const apiEndpoint = "https://telemeter.fujiy.dev/api"
export const wsEndpoint = "wss://telemeter.fujiy.dev/api"
// export const apiEndpointDev = "http://localhost:8888/api"
// export const wsEndpointDev = "ws://localhost:8888/api"
export const apiEndpointDev = "https://telemeter.fujiy.dev/api"
export const wsEndpointDev =  "wss://telemeter.fujiy.dev/api"

export const basePath = "/launch2023"


const ROCKET = 1
const LAUNCHER = 2
const GS1 = 6
const GS2 = 5


function formatLatOrLon(v: number): string {
    const degrees = Math.trunc(v / 10000000)
    const decimal = Math.abs(v) % 10000000
    return `${degrees}.${decimal}`
}

export const packetFormats : {[id: string] : any} = {
    'A': {
        name: 'Attitude',
        entries: {
            'Q': {
                name: 'Quaternion',
                datatype: 'float32',
                index: ['x', 'y', 'z', 'w']
            },
            'A': {
              name: 'Accel',
                unit: 'm/s²',
              datatype: 'float32',
              index: ['x', 'y', 'z']
            },
            'g': {
              name: 'Gyro',
              unit: 'deg/s',
              datatype: 'float32',
              index: ['x', 'y', 'z']
            },
            'm': {
              name: 'Mag',
              unit: 'mT',
              datatype: 'float32',
              index: ['x', 'y', 'z']
            },
        },
        timeout: 0.1,
    },
    'P': {
        name: 'GPS',
        entries: {
            'O': {
                name: 'Longitude',
                unit: '°',
                datatype: 'int32',
                format: formatLatOrLon,
            },
            'A': {
                name: 'Latitude',
                unit: '°',
                datatype: 'int32',
                format: formatLatOrLon,
            },
            'H': {
                name: 'Altitude',
                unit: 'm',
                datatype: 'float32'
            },
            'T': {
                name: 'Time',
                unit: 's',
                datatype: 'uint32'
            },
            'S': {
                name: 'Satellites',
                datatype: 'uint8',
                warning: (n: number) => n < 4 && "4 satellites needed",
            },
        },
        timeout: 10.0,
    },
    'B': {
        name: 'Battery',
        entries: {
            'P': { name: 'Vpp', datatype: 'float16', unit: 'V' },
            'C': { name: 'Vcc', datatype: 'float16', unit: 'V' },
            'D': { name: 'Vdd', datatype: 'float16', unit: 'V' },
            'c': { name: 'Vcc', datatype: 'float16', unit: 'A' },
            'd': { name: 'Vdd', datatype: 'float16', unit: 'A' },
        },
        timeout: 10.0,
    },
    'C': {
        name: 'Command',
        entries: {
            'R': { name: 'RSSI', datatype: 'uint8', unit: 'dB' },
            'C': { name: 'Count', datatype: 'uint32' },
        },
        timeout: 10.0,
    },
    'W': {
        name: 'TWELITE',
        entries: {
            'Q': { name: 'LQI', datatype: 'uint8' },
            'S': { name: 'Sent',   datatype: 'uint32' },
            'R': { name: 'Received',   datatype: 'uint32' },
        },
        timeout: 10.0,
    },
    'a': {
        name: 'Atomsphere',
        entries: {
            'T': {
                name: 'Temperature',
                unit: '℃',
                datatype: 'float16',
                warning: (t: number) =>
                    (t > 40 && 'Too hot') || (t < 10 && 'Too cold'),
            },
            'P': { name: 'Pressure',     unit: 'Pa',  datatype: 'float32' },
            'A': { name: 'Presssure Alt', unit: 'm',  datatype: 'float32' },
            'h': { name: 'Humidity',     unit: 'RH%', datatype: 'float32' },
        },
        timeout: 1.0,
    },
    'L': {
        name: 'Logger',
        entries: {
            't': { name: 'Time', unit: 's', datatype: 'uint32' },
            'w': { name: 'Wrote', datatype: 'uint32' },
            'd': {
                name: 'Dropped',
                datatype: 'uint32',
                warning: (n: number) => n > 0 && "Some packets dropped",
            },
        },
        timeout: 1.0,
    },

    'r': {
        name: 'Recovery',
        entries: {
            'B': { name: 'Battery', datatype: 'float16', unit: 'V' },
            'O': {
                name: 'Longitude',
                unit: '°',
                datatype: 'int32',
                format: formatLatOrLon,
            },
            'A': {
                name: 'Latitude',
                unit: '°',
                datatype: 'int32',
                format: formatLatOrLon,
            },
            'H': {
                name: 'GPS Alt',
                unit: 'm',
                datatype: 'float32'
            },
            'h': {
                name: 'Pressure Alt',
                unit: 'm',
                datatype: 'float32'
            },
            'c': {
                name: 'Command RSSI',
                unit: 'db',
                datatype: 'uint8'
            },
            'r': {
                name: 'Rocket Tlm RSSI',
                unit: 'db',
                datatype: 'uint8'
            },
        },
        timeout: 60.0,
    },
}

export const packetList = [
    {
        from: ROCKET,
        name: 'Rocket',
        ids: ['r', 'A', 'P', 'B', 'H', 'C', 'L']
    },
    {
        from: LAUNCHER,
        name: 'Launcher',
        ids: ['r']
    },
    {
        from: GS1,
        name: 'GS1',
        ids: ['P', 'B']
    },
    {
        from: GS2,
        name: 'GS2',
        ids: ['P', 'B']
    },
]

export const charts = [
    {
        title: 'Launcher Altitude',
        y: [[LAUNCHER, 'r', 'H'], [LAUNCHER, 'r', 'h']],
        yLabel: 'Altitude [m]',
    },
    {
        title: 'Rocket Altitude',
        y: [[ROCKET, 'r', 'H'], [ROCKET, 'r', 'h']],
        yLabel: 'Altitude [m]',
    },
]

export const mapPaths = [
    {
        from: ROCKET,
        name: 'Rocket',
        id: 'P',
        lat: 'A',
        lon: 'O',
        color: '#4FC3F7',
        markerColor: 'white',
    },
    {
        from: LAUNCHER,
        name: 'Launcher',
        id: 'r',
        lat: 'A',
        lon: 'O',
        color: '#4FC3F7',
        markerColor: 'white',
    },
    {
        from: GS1,
        name: 'GS1',
        id: 'P',
        lat: 'A',
        lon: 'O',
        color: 'white',
        markerColor: 'white',
    },
    {
        from: GS2,
        name: 'GS2',
        id: 'P',
        lat: 'A',
        lon: 'O',
        color: 'white',
        markerColor: 'white',
    },
]
