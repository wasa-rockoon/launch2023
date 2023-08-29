
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

function formatDB(v: number): string {
    return `-${v}`
}

export const packetFormats : {[id: string] : any} = {
    'A': {
        name: 'Attitude',
        entries: {
            'Q': { name: 'Quaternion', datatype: 'float32',
                   index: ['x', 'y', 'z', 'w']
                 },
            'A': { name: 'Accel', unit: 'm/s²', datatype: 'float32',
                   index: ['x', 'y', 'z']
                 },
            'g': { name: 'Gyro', unit: 'rad/s', datatype: 'float32',
                   index: ['x', 'y', 'z']
                 },
            'm': { name: 'Mag', unit: 'mT', datatype: 'float32',
                   index: ['x', 'y', 'z']
                 },
        },
        timeout: 0.1,
    },
    'P': {
        name: 'GPS',
        entries: {
            'A': { name: 'Latitude', unit: '°', datatype: 'int32',
                   format: formatLatOrLon,
                 },
            'O': { name: 'Longitude', unit: '°', datatype: 'int32',
                   format: formatLatOrLon,
                 },
            'H': { name: 'Altitude', unit: 'm', datatype: 'float32' },
            'T': { name: 'Time',  unit: 's', datatype: 'uint32' },
            'S': { name: 'Satellites', datatype: 'uint8',
                   warning: (n: number) => n < 4 && "4 satellites needed",
                 },
        },
        timeout: 10.0,
    },
    'B': {
        name: 'Battery',
        entries: {
            'P': { name: 'Vpp', datatype: 'int16', unit: 'V', scale: 0.001 },
            'B': { name: 'Battery 1', datatype: 'int16', unit: 'V',
                   scale: 0.001 },
            'b': { name: 'Battery 2', datatype: 'int16', unit: 'V',
                   scale: 0.001 },
            'C': { name: 'Vcc', datatype: 'int16', unit: 'V', scale: 0.001 },
            'D': { name: 'Vdd', datatype: 'int16', unit: 'V', scale: 0.001 },
            'c': { name: 'Vcc', datatype: 'int16', unit: 'A', scale: 0.001 },
            'd': { name: 'Vdd', datatype: 'int16', unit: 'A', scale: 0.001 },
            'U': { name: 'Rocket Umbilical',
                   enum: ['Not Connected', 'Connected'],
                 },
            'S': { name: 'Rocket Supply',
                   enum: ['Not supplying', 'Supplying'],
                 },
        },
        timeout: 30.0,
    },
    'C': {
        name: 'Command',
        entries: {
            'R': { name: 'RSSI', datatype: 'uint8', unit: 'dB',
                   format: formatDB },
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
    'R': {
        name: 'LoRa',
        entries: {
            'R': { name: 'Launcher RSSI', unit: 'dB', datatype: 'uint8',
                   format: formatDB},
            'r': { name: 'Rocket RSSI', unit: 'dB', datatype: 'uint8',
                   format: formatDB},
            'E': { name: 'Environment RSSI', unit: 'dB', datatype: 'uint8',
                   format: formatDB},
            'C': { name: 'Laucher Received', datatype: 'uint32' },
            'c': { name: 'Rocket Received', datatype: 'uint32' },
            'S': { name: 'Laucher Sent', datatype: 'uint32' },
        },
        timeout: 10.0,
    },
    'a': {
        name: 'Atomsphere',
        entries: {
            'T': { name: 'Ambient Temperature', unit: '℃', datatype: 'float16',
                 },
            'I': { name: 'Interiour Temperature', unit: '℃',
                   datatype: 'float16',
                   warning: (t: number) =>
                (t > 40 && 'Too hot') || (t < 10 && 'Too cold'),
                 },
            'P': { name: 'Pressure',     unit: 'Pa',  datatype: 'float32' },
            'A': { name: 'Presssure Alt', unit: 'm',  datatype: 'float32' },
            'H': { name: 'Humidity',     unit: 'RH%', datatype: 'float32' },
            'R': { name: 'Ascent Rate', unit: 'm/s', datatype: 'float16' },
            's': { name: 'Flight Sequence',
                   enum: ['Before Flight', 'Ascending', 'Descending', 'Landed']
                 },
        },
        timeout: 1.0,
    },
    'I': {
        name: 'Igniter',
        entries: {
            'B': { name: 'Battery', datatype: 'int16', unit: 'V',
                   scale: 0.001 },
            'R': { name: 'Resistance', datatype: 'float16', unit: 'Ω' },
            'I': { name: 'Current', datatype: 'int16', unit: 'A',
                   scale: 0.001 },
            'D': { name: 'Duty', datatype: 'uint8', unit: '%'},
            'C': { name: 'Launch Condition', enum: ['Yes', 'No'] },
            'M': { name: 'Launch Mode',
                   enum: ['No Launch', 'Allowed to Launch']
                 },
            's': { name: 'Launch Sequence',
                   enum: ['No Launch', 'Waiting', 'Stabilizing',
                          'Igniting', 'Completed']
                 },
            'c': { name: 'Sequence Count', datatype: 'uint32_t', unit: 's' },
        }
    },
    'L': {
        name: 'Logger',
        entries: {
            't': { name: 'Time', unit: 's', datatype: 'uint32' },
            'w': { name: 'Wrote', datatype: 'uint32' },
            'd': { name: 'Dropped', datatype: 'uint32',
                   warning: (n: number) => n > 0 && "Some packets dropped",
                 },
        },
        timeout: 1.0,
    },

    'r': {
        name: 'Recovery',
        entries: {
            'O': { name: 'Longitude', unit: '°', datatype: 'int32',
                   format: formatLatOrLon,
                 },
            'A': { name: 'Latitude', unit: '°', datatype: 'int32',
                   format: formatLatOrLon,
                 },
            'H': { name: 'GPS Alt', unit: 'm', datatype: 'float32' },
            'h': { name: 'Pressure Alt', unit: 'm', datatype: 'float32',
                   validate: (h: number) => (-1000 < h && h < 50000)
                 },
            'R': { name: 'Ascent Rate', unit: 'm/s', datatype: 'float16' },
        },
        timeout: 30.0,
    },
    's': {
        name: 'Status',
        entries: {
            'B': { name: 'Battery', datatype: 'int16', unit: 'V',
                   scale: 0.001 },
            'P': { name: 'Pressure', unit: 'Pa',  datatype: 'float32' },
            'T': { name: 'Ambient Temperature', unit: '℃', datatype: 'float16',
                 },
            'I': { name: 'Interiour Temperature', unit: '℃',
                   datatype: 'float16',
                   warning: (t: number) =>
                (t > 40 && 'Too hot') || (t < 10 && 'Too cold'),
                 },
            's': { name: 'Flight Sequence',
                   enum: ['Before Flight', 'Ascending', 'Descending', 'Landed']
                 },
            'S': { name: 'Rocket Sequence',
                   enum: ['Before Launch', 'In Flight', 'Recovery']
                 },
            'l': { name: 'Launch Sequence',
                   enum: ['No Launch', 'Waiting', 'Stabilizing',
                          'Igniting', 'Completed']
                 },
            'L': { name: 'Launch Count', datatype: 'uint32_t', unit: 's' },
            'M': { name: 'Launch Mode',
                   enum: ['No Launch', 'Allowed to Launch']
                 },
            'c': { name: 'Command Count', datatype: 'uint32' },
            'C': { name: 'Command RSSI', unit: 'dB', datatype: 'uint8',
                   format: formatDB,
                 },
        },
        timeout: 30.0,
    },
    'M': {
        name: 'Launch Mode',
        entries: {
            'L': { name: 'Mode',
                   enum: ['No Launch', 'Allowed to Launch']
                 },
        }
    },
    'S': {
        name: 'Settings',
        entries: {
            'P': { name: 'Sealevel Pressure', datatype: 'float32', unit: 'Pa' },
            'A': { name: 'Launch Altitude', datatype: 'float32', unit: 'm' },
        }
    }
}

export const packetList = [
    {
        from: LAUNCHER,
        name: 'Launcher Telemetry',
        ids: ['r', 's', 'S'],
        optionals: ['S']
    },
    {
        from: ROCKET,
        name: 'Rocket Telemetry',
        ids: ['r', 's', 'S'],
        optionals: ['S']
    },
    {
        from: GS1,
        name: 'GS1',
        ids: ['R', 'P', 'M', 'B'],
        optionals: ['M'],
    },
    {
        from: GS2,
        name: 'GS2',
        ids: ['R', 'P', 'M', 'B'],
        optionals: ['M'],
    },
]

export const errors = [
    {
        from: LAUNCHER,
        name: 'Launcher Errors',
        modules: [
            {
                name: 'B',
                title: 'Battery Power A',
                index: 0,
                bits: ['Bus',
                       'Battery Temperature',
                       'Vpp Voltage',
                       'Battery 1 Voltage',
                       'Battery 2 Voltage',
                       'Vcc Voltage',
                       'Vdd Voltage',
                       'Vcc Current',
                       'Vdd Current'
                      ]
            },
            {
                name: 'B',
                index: 1,
                title: 'Battery Power B',
                bits: ['Bus',
                       'Battery Temperature',
                       'Vpp Voltage',
                       'Battery 1 Voltage',
                       'Battery 2 Voltage',
                       'Vcc Voltage',
                       'Vdd Voltage',
                       'Vcc Current',
                       'Vdd Current'
                      ]
            },
            {
                name: 'R',
                title: 'LoRa',
                bits: ['Bus', 'LoRa 1', 'LoRa 2']
            },
            {
                name: 'C',
                title: 'Comm&Log',
                bits: ['Bus',
                       'SD Card',
                       'LoRa',
                       'TWELITE',
                      ]
            },
            {
                name: 'I',
                title: 'INS',
                bits: ['Bus',
                       'GNSS Receiver',
                       'IMU Sensor',
                       'Pressure Sensor',
                       'Temperature',
                      ]
            },
        ]
    },
    {
        from: ROCKET,
        name: 'Rocket Errors',
        modules: [],
    }
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
    {
        title: 'Pressure',
        y: [[ROCKET, 's', 'P'], [LAUNCHER, 's', 'P']],
        yLabel: 'Pressure [Pa]',
    },
    {
        title: 'Launcher Temperature',
        y: [[LAUNCHER, 's', 'T'], [LAUNCHER, 's', 'I']],
        yLabel: 'Temperature [℃]',
    },
    {
        title: 'LoRa',
        y: [[GS1, 'R', 'R'], [GS1, 'R', 'r'],
            [GS2, 'R', 'R'], [GS2, 'R', 'r'],
           ],
        yLabel: 'RSSI [dB]',
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
