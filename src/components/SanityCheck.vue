<template>
  <v-card v-for="(unit, i) in units" :key="i" class="mb-3">
    <v-card-item>
      <template v-slot:prepend>
        <v-icon v-if="unit.timeout" color="error"
                icon="mdi-clock-alert-outline"></v-icon>
        <v-icon v-else-if="unit.modules.some(m => !m.bits)"
                icon="mdi-help" color="error"></v-icon>
        <v-icon v-else-if="unit.modules.some(m => !m.sanity)" color="error"
                icon="mdi-alert-circle"></v-icon>
        <v-icon v-else icon="mdi-check" color="primary"></v-icon>
      </template>

      <v-card-title class="mr-10 text-wrap">{{unit.name}}</v-card-title>

      <v-card-subtitle v-if="unit.sanity" class="mr-10">
        {{datastore.showT(unit.sanity.t)}} #{{unit.sanity.count}}
        {{unit.sanity.source}}
      </v-card-subtitle>
      <v-card-subtitle v-else class="mr-10">N/A</v-card-subtitle>
    </v-card-item>
    <v-card-text class="pa-0">
      <v-list v-model:opened="open[unit.from]">
        <v-list-group v-for="(module, name) in unit.modules"
                      :key="name" :value="name">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon v-if="!module.bits" icon="mdi-help" color="error">
                </v-icon>
                <v-icon v-else-if="!module.sanity" icon="mdi-alert-circle"
                        color="error"></v-icon>
                <v-icon v-else icon="mdi-check" color="primary"></v-icon>
              </template>
              <v-list-item-title>{{module.title}}</v-list-item-title>
              <v-list-item-subtitle v-if="module.bits">
                [{{module.node}}]
                Error #{{module.error_count}} ({{module.error_code}})
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>N/A</v-list-item-subtitle>
            </v-list-item>
          </template>

          <span v-for="(bit, i) in module.bits" :key="i">
            <v-chip v-if="bit.error" color="error" class="ma-1" >
              <v-icon start icon="mdi-alert-circle"></v-icon>
              {{ bit.title }}
            </v-chip>
            <v-chip v-else color="secondary" class="ma-1">
              <v-icon start icon="mdi-check"></v-icon>
              {{ bit.title }}
            </v-chip>
          </span>
        </v-list-group>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, inject, computed, Ref, watch,
         defineProps, ShallowRef } from 'vue'
import { DataStore, PacketInfo } from '../library/datastore'
import { Packet } from '../library/packet'
import * as settings from '../settings'

const props = defineProps(['time'])

const datastore = inject<ShallowRef<DataStore>>('datastore')

const initialOpen = {}

const open = ref(initialOpen)

const units = computed(() => {
  if (!datastore.value) return []
  return settings.errors.map(unit => {
    const sanity =
      datastore.value.getBy(unit.from, '?')?.at(props.time ?? new Date())
    const error =
      datastore.value.getBy(unit.from, '!')?.at(props.time ?? new Date())
    const modules = unit.modules.map(module => {
      const sanity_entry = sanity.packet &&
                           sanity.packet.get(module.name, module.index)
      const error_entry = error.packet &&
                          error.packet.get(module.name, module.index)
      return {
        title: module.title,
        node: sanity_entry && sanity_entry.payload.uint8,
        sanity: sanity_entry && (sanity_entry.payload.uint32 >> 8) == 0,
        error: error_entry,
        error_count: error_entry && error_entry.payload.uint8,
        error_code: error_entry && error_entry.payload.string.slice(1),
        bits: sanity_entry && module.bits.map((bit, i) => {
          return {
            title: bit,
            error: sanity_entry &&
                   (sanity_entry.payload.uint32 & (1 << (i + 8))),
          }
        })
      }
    })
    const sanity_timeout = !sanity.t ||
      datastore.value.time2t(props.time) - sanity.t > unit.timeout
    const error_timeout = !error.t ||
      datastore.value.time2t(props.time) - error.t > unit.timeout

    return {
      from: unit.from,
      name: unit.name,
      sanity: sanity,
      modules: modules,
      timeout: unit.timeout && (sanity_timeout || error_timeout),
    }
  })
})

watch(units, () => {
  // console.log('units', units.value)
})


</script>

