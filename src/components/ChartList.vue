<template>
  <v-card>
    <v-card v-for="(chart, i) in charts" :key="i" class="w-100">
      <v-card-item class="pb-0">{{chart.config.title}}</v-card-item>
      <div v-if="chart.data" class="w-100">
        <Scatter :data="chart.data" :options="chart.options"
                 class="pa-3 pt-0"/>
      </div>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { watch, ref, inject, Ref, defineProps, ShallowRef, shallowRef, triggerRef, onMounted, computed, reactive } from 'vue'
import {
  Chart as ChartJS,
  Title,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Colors,
} from 'chart.js'
import { Scatter } from 'vue-chartjs'
import { DataStore } from '../library/datastore'
import * as settings from '../settings'

ChartJS.register(Title, LinearScale, PointElement, LineElement, Tooltip, Legend, Colors)

ChartJS.defaults.color = '#FFFFFF'
ChartJS.defaults.borderColor = '#888888'

const datastore = inject<ShallowRef<DataStore>>('datastore')

const props = defineProps(['range'])

const maxPoints = 1000

const chartsValue = computed(() => charts.value)

const charts = shallowRef(
  settings.charts.map(config => {
    return {
      config: config,
      data: {
        datasets: config.y.map(y => {
          const format = settings.packetFormats[y.id]?.entries[y.type]
          let name = y.name
          if (format?.index) name += ` (${format.index[y.index ?? 0]})`

          return {
            label: name,
            format: format,
            lastUpdateTime: props.range.min,
            data: [],
            showLine: true,
            fill: false,
            pointRadius: 0,
          }
        }),
      },
      options: {
        aspectRatio: 1.5,
        animation: false,
        plugins: {
          title: {
            display: false,
            text: config.title,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 't [s]',
            },
            min: props.range?.min,
            max: props.range?.max,
          },
          y: {
            title: {
              display: true,
              text: config.yLabel,
            },
          }
        },
        legend: {
          display: config.y.length > 1
        },
        parsing: false,
        normalized: true,
        spanGaps: true,
        responsive: true,
      },
    }
  })
)

const update = () => {
  if (!datastore.value) return

  const newCharts = []

  for (let chart of charts.value) {
    const newChart = { data: {datasets: []}, config: chart.config }
    chart.config.y.forEach((y, i) => {
      const dataset = chart.data.datasets[i]

      if (dataset.data.length > maxPoints) {
        dataset.lastUpdateTime = undefined
        dataset.data = []
      }

      const dataseries = datastore.value.getBy(y.from, y.id);
      const tv = dataseries.getValues(
        y.type, y.index ?? 0, dataset.lastUpdateTime, props.range.max,
        maxPoints / 2)
      for (let n = 0; n < tv.times.length; n++) {
        if (dataset.format.validate && !dataset.format.validate(tv.values[n]))
          continue;
        dataset.data.push({x: tv.times[n], y: tv.values[n]})
      }
      dataset.lastUpdateTime = tv.times[tv.times.length - 1]
      newChart.data.datasets.push(dataset)
    })

    newCharts.push(newChart)
  }
  // console.log(chartsValue.value)
  charts.value = newCharts
}

watch(datastore, update)

onMounted(update);

</script>
