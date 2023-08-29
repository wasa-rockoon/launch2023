<template>
  <div class="system h-screen overflow-hidden">
    <v-app-bar color="primary" height=40>
    <v-btn icon="mdi-arrow-left" :to="'/'"></v-btn>
    <v-spacer></v-spacer>

    <FlightSettings :flight="flight" v-on:update="onUpdateFlight"/>

    <v-spacer></v-spacer>

    <LoginModal :system="system" v-on:login="onLogin" />

    <template v-slot:extension v-if="display.xs.value" >
      <v-tabs v-model="tab" fixed-tabs class="w-100">
        <v-tab value="map">Map</v-tab>
        <v-tab value="charts">Charts</v-tab>
        <v-tab value="status">Status</v-tab>
        <v-tab value="packets">Packets</v-tab>
      </v-tabs>
    </template>

    </v-app-bar>
    <v-main v-if="flight" class="h-100 overflow-hidden" >
      <keep-alive class="h-100">
        <v-container v-if="display.xs.value" class="h-100 pa-0 pb-16">

          <v-window v-model="tab" class="overflow-y-auto h-100 pa-2">
            <v-window-item value="map">
              <FlightMap :time="currentTime"/>
            </v-window-item>
            <v-window-item value="charts" class="overflow-y-auto ">
              <ChartList :range="chartRange" />
            </v-window-item>
            <v-window-item value="status">
              <SanityCheck :time="currentTime"/>
            </v-window-item>
            <v-window-item value="packets">
              <PacketList :time="currentTime"/>
            </v-window-item>
          </v-window>
        </v-container>

        <v-container v-else-if="display.smAndDown.value">
          <v-row class="h-100">
            <v-col class="pa-2 pr-1 overflow-y-auto h-100 pb-16" cols="6">
              <FlightMap :time="currentTime" class="mb-3" />
              <ChartList :range="chartRange" />
            </v-col>
            <v-col class="pa-2 overflow-y-auto h-100 pb-16" cols="6" >
              <SanityCheck :time="currentTime"/>
              <PacketList :time="currentTime"/>
            </v-col>
          </v-row>
        </v-container>

        <v-container v-else class="ma-0 w-screen h-100">
          <v-row class="h-100">
            <v-col class="pa-2 pr-1 overflow-y-auto " cols="3">
              <FlightMap :time="currentTime"/>
            </v-col>
            <v-col class="pa-2 pr-1 overflow-y-auto h-100" cols="3">
              <ChartList :range="chartRange" />
            </v-col>
            <v-col class="pa-2 pr-1 overflow-y-auto h-100 pb-16" cols="3" >
              <SanityCheck :time="currentTime"/>
            </v-col>
            <v-col class="pa-2 overflow-y-auto h-100 pb-16" cols="3" >
              <PacketList :time="currentTime"/>
            </v-col>
          </v-row>
        </v-container>

      </keep-alive>

    </v-main>

    <v-footer fixed elevation="20">
      <FlightTimeline :events="events"
                      v-on:change-time="onChangeTime" />
    </v-footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, inject, provide, computed,
         getCurrentInstance, watch, shallowRef, triggerRef} from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useDisplay } from "vuetify";
import axios from 'axios'
import { Flight, System, api } from '../library/api'
import { DataStore } from '../library/datastore'
import { Packet } from 'wccp'
import LoginModal from '../components/LoginModal'
import FlightSettings from '../components/FlightSettings'
import FlightTimeline from '../components/FlightTimeline'
import PacketList from '../components/PacketList'
import SanityCheck from '../components/SanityCheck'
import ChartList from '../components/ChartList'
import FlightMap from '../components/FlightMap'
import VideoPlayer from '../components/VideoPlayer'

const datastore = shallowRef<DataStore | undefined>(undefined)

const flight = computed<Flight>(() => datastore.value?.flight)
const system = computed<System | undefined>(() => flight.value?.system)

provide('datastore', datastore)

const currentTime = ref(new Date())
const chartRange = ref({})

let connection = undefined

const route = useRoute()
const router = useRouter()

const instance = getCurrentInstance()

const display = useDisplay()
const tab = ref(null)

const events = computed(() =>
  datastore.value &&
  [{
  name: 'Release',
  time: datastore.value?.launchTime
  }] || []
)

onMounted(async () => {
  try {
    const flight = await api.getFlight(route.query.id)
    datastore.value = new DataStore(flight)
    datastore.value.currentTime = flight.startTime

    connection = await api.connect(flight.id, 'web',
                                   flight.startTime, undefined,
                                   onReceive)
    console.log('flight', flight, connection)
  }
  catch {
    console.log('unknown flight', inject('systemId'), route.query.id)
    router.push('/systems')
  }
})

onBeforeRouteLeave((to, from) => {
  connection?.close()
})

const onReceive = (packets: {packet: Packet, time: Date, source: string }[]) => {
  console.log('received', packets.length)
  datastore.value.addPackets(packets)
  triggerRef(datastore)
}

const onUpdateFlight = async (flight_) => {
  datastore.value.flight = flight_
  triggerRef(datastore)
}

const onLogin = (newSystem) => {
  flight.value.system = newSystem
}

const onChangeTime = (time) => {
  currentTime.value = time
}

const onChangeChartRange = (range) => {
  chartRange.value = range
}


</script>

<style>

.v-main>.v-container {
  max-width: 100vw;
}

 .v-footer {
   position: sticky;
   bottom: 0;
 }
</style>
