<template>
  <v-card class="w-100" ref="canvas" @mousemove="onDrag" @mousedown="onDragStart">
    <v-stage :config="config" class="w-100">
      <v-layer>
        <v-rect :config="sky"/>
      </v-layer>
      <v-layer>
        <v-group :config="rollGroup">
          <v-rect :config="ground"/>
          <v-line :config="horizon"/>
          <v-line v-for="h in rollLinesFiltered" :key="h.i" :config="h.config">
          </v-line>
          <v-text v-for="h in rollTextsFiltered" :key="h.i" :config="h.config">
          </v-text>
        </v-group>
        <v-group :config="targetGroup">
          <v-group v-for="t in targets" :key="t.i" :config="t.config">
            <v-circle v-if="t.inScreen" :config="t.marker"/>
            <v-line v-else :config="t.arrow"/>
            <v-group :config="t.labels">
              <v-text :config="t.name"/>
              <v-text :config="t.distance"/>
              <v-text :config="t.ago"/>
            </v-group>
          </v-group>
        </v-group>
        <v-group :config="headingGroup">
          <v-line v-for="h in headingMarkers" :key="h.i" :config="h.config"></v-line>
          <v-text v-for="h in headingTexts" :key="h.i" :config="h.config"></v-text>
        </v-group>
      </v-layer>
      <v-layer>

      </v-layer>
    </v-stage>
    <v-btn @click="clicked">Start Tracking</v-btn>
    <!-- <div>{{heading.toFixed(2)}}</div>
         <div>{{pitch.toFixed(2)}}</div>
         <div>{{roll.toFixed(2)}}</div> -->
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, ShallowRef, defineProps, watch } from 'vue'
import VueKonva from 'vue-konva'
import Quaternion from 'quaternion'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { DataStore } from '../library/datastore'
import * as settings from '../settings'

const FoV = Math.PI / 6

const props = defineProps(['time'])

const datastore = inject<ShallowRef<DataStore>>('datastore')

const canvas = ref()

const heading = ref(0.0)
const pitch = ref(- Math.PI / 2)
const roll = ref(0.0)


const deviceLocation = ref(null)



const width = computed(() => {
  if (canvas.value) return canvas.value.$el.clientWidth
  else return 400
})
const height = computed(() => {
  if (canvas.value) return canvas.value.$el.clientWidth / 1.5
  else return 400
})

const config = computed(() => {
  return {
    width: width.value,
    height: height.value,
  }
})

const sky = {
  width: 10000,
  height: 10000,
  fill: '#5C8CBB',
}

const ground = computed(() => {
  return {
    x: -5000,
    width: 10000,
    height: 10000,
    fill: '#735037',
  }
})
const horizon = computed(() => {
  return {
    points: [-10000, 0, 10000, 0],
    stroke: 'white',
  }
})

const rollGroup = computed(() => {
  return {
    x: width.value / 2
     + Math.sin(roll.value) * Math.sin((pitch.value - Math.PI / 2)) * width.value,
    y: height.value / 2 + Math.sin((pitch.value - Math.PI / 2)) * width.value,
    rotation: - roll.value * 180 / Math.PI,
  }
})


const rollTextsFiltered = computed(() => {
  return rollTexts.filter(l => {
    return l.config.y + rollGroup.value.y < height.value - 50;
  })
})

const rollLinesFiltered = computed(() => {
  return rollLines.filter(l => {
    return l.config.y + rollGroup.value.y < height.value - 40;
  })
})


const rollTexts = Array(18).fill(0).map((_,i) => {
  const degree = i * 10 - 90
  if (degree == 0 || degree == -90) return null
  return {
    i: i,
    config: {
      x: -50,
      y: - degree / 180.0 / FoV * width.value - 10,
      text: String(Math.abs(degree)),
      fontSize: 20,
      fill: 'white',
      width: 100,
      align: 'center',
    }
  }
}).filter(t => t)

const rollLines = Array(36).fill(0).map((_,i) => {
  const degree = i * 5 - 90
  if (degree == 0 || degree == -90) return []
  if (degree % 10 == 0) {
    return [{
      i: i,
      degree: degree,
      config: {
        y: - degree / 180.0 / FoV * height.value,
        points: [-80, 0, -20, 0],
        stroke: 'white',
      }
    },
    {
      i: i + 0.5,
      degree: degree,
      config: {
        y: - degree / 180.0 / FoV * height.value,
        points: [20, 0, 80, 0],
        stroke: 'white',
      }
    },
    ]
  }
  else {
    return [{
      i: i,
      degree: degree,
      config: {
        y: - degree / 180.0 / FoV * width.value,
        points: [-40, 0, 40, 0],
        stroke: 'white',
      }
    }]
    }
}).flat()



const headingGroup = computed(() => {
  return {
    x: (width.value / 2.0 - (heading.value % (2 * Math.PI)) / FoV * width.value),
    y: height.value,
  }
})

const headingTexts = Array(48).fill(0).map((_,i) => {
  const degree = i * 10
  let text = String((degree - 240 + 360) % 360 / 10)
  if (text == "0") text = "N"
  else if (text == "9") text = "E"
  else if (text == "18") text = "S"
  else if (text == "24") text = "W"
  return {
    i: i,
    config: {
      x: (degree - 240) * Math.PI / 180 / FoV * width.value - 50,
      y: -30,
      text: text,
      fontSize: 20,
      fill: 'white',
      width: 100,
      align: 'center',
    }
  }
})

const headingMarkers = Array(48*4).fill(0).map((_,i) => {
  const degree = i * 2.5
  return {
    i: i,
    config: {
      x: (degree - 240) * Math.PI / 180 / FoV * width.value,
      points: [0, i % 4 == 0 ? -7.5 : -15, 0, 0],
      stroke: 'white',
    }
  }
})


const targetGroup = computed(() => {
  return {
    x: width.value / 2.0,
    y: height.value / 2.0,
    rotation: - roll.value * 180 / Math.PI,
  }
})

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

const targets = computed(() => {
  return targetData.value.map(data => {
    if (data.direction == undefined || data.elevation == undefined) return null
    const x = - ((heading.value - data.direction) % (2*Math.PI)) / FoV * width.value
    const y = Math.sin(((pitch.value + data.elevation) - Math.PI / 2)) * width.value
    // const x_ = x * Math.cos(roll.value) - y * Math.cos(roll.value)
    // const y_ = x * Math.sin(roll.value) + y * Math.sin(roll.value)
    const x_ = x
    const y_ = y
    let inScreen = true;
    if (x_ < - width.value / 2 || width.value / 2 < x_) inScreen = false;
    if (y_ < - height.value / 2 || height.value / 2 < y_) inScreen = false;
    let pad = inScreen ? 0 : 10
    return {
      config: {
        x: Math.max(- width.value / 2 + pad, Math.min(x, width.value / 2 - pad)),
        y: Math.max(- height.value / 2 + pad, Math.min(y, height.value / 2 - pad)),
      },
      inScreen: inScreen,
      arrow: {
        points: [-20, 0, 0, 0, 0, -20],
        stroke: data.color,
        strokeWidth: 5,
        rotation: Math.atan2(y, x) / Math.PI * 180 - 45,
      },
      marker: {
        radius: 10,
        fill: data.color,
      },
      labels: {
        x: x_ < - width.value/2 + 20 ? 50 : width.value/2 - 20 < x_ ? -50 : 0,
        y: y_ < - height.value/2 + 20 ? 20
              : height.value/2 - 60 < y_ ? -60
              : Math.abs(x_) < width.value / 2 - 20 ? 10
              : -20,
      },
      name: {
        x: -50,
        y: 0,
        text: data.name,
        fontSize: 20,
        width: 100,
        align: 'center',
        fill: data.color,
        stroke: 'white',
        strokeWidth: 0.5,
        fontStyle: "bold",
      },
      distance: {
        x: -50,
        y: 20,
        text: (data.distance / 1000).toFixed(1) + ' km',
        fontSize: 15,
        width: 100,
        align: 'center',
        fill: data.color,
        stroke: 'white',
        strokeWidth: 0.5
      },
      ago: {
        x: -50,
        y: 35,
        text: timeAgo.format(data.age, 'mini'),
        fontSize: 15,
        width: 100,
        align: 'center',
        fill: data.color,
        stroke: 'white',
        strokeWidth: 0.5
      }
    }
  }).filter(t => t)
})


const targetData = ref([])

watch([datastore, deviceLocation], () => {
  if (!datastore.value) return []

  if (!deviceLocation.value) return []

  targetData.value = settings.mapPaths.flatMap(path => {
    const p = datastore.value.getBy(path.from, path.id).at(props.time ?? new Date())
    if (!p.packet) return []
    const format = settings.packetFormats[path.id]
    const lat = p.packet.get(path.lat)?.formatNumber(format.entries[path.lat])
    const lon = p.packet.get(path.lon)?.formatNumber(format.entries[path.lon])
    const alt = (path.alt &&
                 p.packet.get(path.alt)?.formatNumber(format.entries[path.alt])) || 0
    if (!lat || !lon) return []

    const lat_middle = (lat - deviceLocation.value.latitude) / 2
    const north = latitudeDistance(lat - deviceLocation.value.latitude)
    const east = longitudeDistance(lon - deviceLocation.value.longitude, lat_middle)
    const up = alt - (deviceLocation.value.altitude || 0)
    const distance = Math.sqrt(north * north + east * east + up * up)

    return [{
      elevation: Math.asin(up / distance),
      direction: - Math.atan2(- east, north),
      distance: distance,
      age: datastore.value.t2time(p.t),
      color: path.markerColor ?? path.color,
      name: path.name,
    }]
  })
  console.log(targetData.value)
})


let location_timer;
onMounted(() => {
  navigator.geolocation.getCurrentPosition(location => {
    deviceLocation.value = location.coords
  })
  location_timer = setInterval(() => {
    navigator.geolocation.getCurrentPosition(location => {
      deviceLocation.value = location.coords
    })
  }, 10000);
})
onUnmounted(() => {
  clearInterval(location_timer);
})

let clientX;
let clientY;

const onDragStart = e => {
  clientX = null
  clientY = null
}

const onDrag = e => {
  if (window.DeviceOrientationEvent) return
  if (!e.buttons) return

  if (!clientX) clientX = e.clientX
  if (!clientY) clientY = e.clientY

  const dx = e.clientX - clientX
  const dy = e.clientY - clientY
  clientX = e.clientX
  clientY = e.clientY

  heading.value -= FoV * dx / width.value * 2
  pitch.value -= FoV * dy / height.value
}


const FPS = 30
let last_update = new Date()
let heading_start = null;

const handleOrientation = o => {
  if (new Date() - last_update < 1000 / 30) return;
  last_update = new Date()


  const deg = Math.PI / 180;

  if (o.webkitCompassHeading == undefined) heading_start = 0
  if (heading_start == null && o.webkitCompassHeading != 0)
    heading_start = o.webkitCompassHeading * deg

  const q = Quaternion.fromEulerLogical(
    o.alpha * deg, o.beta * deg, -o.gamma * deg, 'ZXY')
  const euler = q.inverse().toEuler('ZYX')
  let h = euler[0] + (heading_start || 0)
  if (h > Math.PI) h -= 2 * Math.PI
  if (h < - Math.PI) h += 2 * Math.PI
  heading.value = h
  roll.value = euler[1]
  pitch.value = euler[2]
}

const clicked = () => {
  console.log('clicked')
  if (window.DeviceOrientationEvent) {
    window.DeviceOrientationEvent.requestPermission()
    window.addEventListener("deviceorientation", handleOrientation, true);
  }
}

const CIRCLES_OF_LONGITUDE = 40008000.0
const EQUATOR_RADIUS = 6378137.0

function latitudeDistance(lat) {
  return lat * CIRCLES_OF_LONGITUDE / 360.0;
}
function longitudeDistance(lng, lat) {
  return EQUATOR_RADIUS * Math.cos(lat / 180.0 * Math.PI) * lng / 180.0 * Math.PI;
}

</script>
