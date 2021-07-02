<template>
  <v-app>
    <v-main>
      <MapViewer />
    </v-main>
  </v-app>
</template>

<script>
import MapViewer from './components/MapViewer'

export default {
  name: 'App',

  components: {
    MapViewer
  },

  data: () => ({
    //
  })
}
</script>
