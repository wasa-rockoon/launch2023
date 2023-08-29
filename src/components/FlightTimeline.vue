<template>
  <v-container id="timeline" class="w-screen ma-0 pa-0">
    <v-row align="center">
      <v-col id="timeline-t">
        <span v-if="datastore">
          {{datastore.showT(currentT)}}
        </span>
      </v-col>
      <v-col align-self="start">
        <vue-slider id="timeline-slider" v-model="currentT" ref="sliderRef"
                    :min="min" :max="max" :interval="0.001"
                    :process="process" :marks="marks" :dot-options="dotOptions"
                    :drag-on-click="true"
                    :tooltip-placement="'top'"
                    :dot-size="[10,10]" :duration="0"
                    :contained="true">
        </vue-slider>
      </v-col>
      <v-col id="timeline-control">
        <v-btn-toggle v-model="toggle" divided variant="outlined"
                      color="primary">
          <v-btn icon="mdi-skip-backward"></v-btn>
          <v-btn v-if="!playing" icon="mdi-play"></v-btn>
          <v-btn v-if="playing" icon="mdi-pause"></v-btn>
          <v-btn icon="mdi-skip-forward"></v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, inject, computed, Ref, watch,
         defineEmits, ShallowRef, triggerRef, defineProps } from 'vue';
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { DataStore } from '../library/datastore'

const datastore = inject<ShallowRef<DataStore>>('datastore')

const props = defineProps(['events'])

const playing = ref(false)
const toggle = ref(null)
const sliderRef = ref(null)
const currentT = ref(0)
const min = ref(0)
const max = ref(100)

const emit = defineEmits(['change-time'])

const dotOptions = { tooltip: 'active' }

const marks = computed(() => {
  const m = {}
  if (datastore.value) {
    m[currentT.value] = {
      label: '',
      style: {
        width: '18px',
        height: '18px',
        display: 'block',
        backgroundColor: '#2196F3',
        transform: 'translate(-7px, -7px)'
      },

    }
    for (const event of props.events) {
      const t = datastore.value.time2t(event.time)
      if (t < min.value || max.value < t) continue
      m[Math.round(t.toString())] ={
        label: event.name,
        style: {
          width: '8px',
          height: '8px',
          display: 'block',
          backgroundColor: '#303030',
          transform: 'translate(-2px, -2px)'
        },

      }
    }
  }
  return m
})

const process = (dotPos: number) => {
  if (!datastore.value) return []
  const earliestT = datastore.value.earliestT ?? datastore.value.startT
  const latestT = datastore.value.latestT ?? datastore.value.endT
                 ?? datastore.value.nowT
  return [[sliderPercent(earliestT), sliderPercent(latestT),
           { backgroundColor: '#2196F3' }]]
}

// const formatter = (t: number) => {
//   if (t == Math.min(slider.value[0], slider.value[2]))
//     return `Chart min: ${datastore.value?.showT(t)}`
//   else if (t == Math.max(slider.value[0], slider.value[2]))
//     return `Chart max: ${datastore.value?.showT(t)}`
//   else return ''
// }

let prevTimestamp = null
let liveT = null

const liveTimeline = (timestamp) => {
  if (prevTimestamp) {
    if (playing.value) {
      liveT = currentT.value + (timestamp - prevTimestamp) / 1000.0
      if (liveT > max.value) liveT = max.value
      sliderRef.value.setValue(liveT)
    }
    if (datastore.value && !datastore.value.endT) {
      max.value = datastore.value.nowT
    }

    if (currentT.value < min.value) sliderRef.value.setValue(min.value)
    if (currentT.value > max.value) sliderRef.value.setValue(max.value)
  }
  prevTimestamp = timestamp

  requestAnimationFrame(liveTimeline)
}

onMounted(() => {
  requestAnimationFrame(liveTimeline)
})

watch(currentT, (cr, prev) => {

  if (cr != prev) {
    if (cr != liveT) {
      // playing.value = false
      // toggle.value = null
    }
    emit('change-time', datastore.value.t2time(currentT.value))
  }
})

watch(toggle, (cr: number, prev: number) => {
  if (cr == undefined) {
    playing.value = false
  }
  else if (cr == 0) {
    playing.value = false
    toggle.value = null
    sliderRef.value.setValue(datastore.value.startT)
  }
  else if (cr == 1 && playing.value) {
    playing.value = false
    toggle.value = null
  }
  else if (cr == 1) playing.value = true
  else if (cr == 2) {
    max.value = datastore.value.endT ?? datastore.value.nowT
    sliderRef.value.setValue(datastore.value.endT ?? datastore.value.nowT)
    playing.value = true
  }
})


watch(datastore, (cr, prev) => {
  min.value = cr.startT
  max.value = cr.endT ?? cr.nowT
  if (!prev) {
    currentT.value = datastore.value.endTime ? 0 : max.value
  }
})

const sliderPercent = (t: number) => {
  const range = max.value - min.value
  const p = (t - min.value) / range * 100.0
  if (p < 0) return 0
  else if (p > 100) return 100
  else return p
}

</script>>


<style>

#timeline {
  max-width: 100vw;
}

#timeline-t {
  min-width: 150px;
  max-width: 200px;
  font-family: monospace;
  font-size: 20px;
}
#timeline-control {
  min-width: 150px;
  max-width: 200px;
}
#timeline-slider {
  min-width: calc(100vw - 400px);
}

#timeline .vue-slider {
  margin-top: 8px;
}

.vue-slider-dot {
  /* transition: none!important; */
}

</style>
