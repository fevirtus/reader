<template>
  <div>
    <NuxtLayout>
      <NuxtPage :key="$route.fullPath" />
    </NuxtLayout>
    <NuxtRouteAnnouncer />
  </div>
</template>
