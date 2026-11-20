// Limit Gradle's parallel native builds so the EAS worker doesn't get OOM-killed
// while compiling Skia, Worklets, Reanimated and expo-modules-core at once.
const { withGradleProperties } = require('@expo/config-plugins');

function setProp(props, key, value) {
  const existing = props.find((p) => p.type === 'property' && p.key === key);
  if (existing) existing.value = value;
  else props.push({ type: 'property', key, value });
}

module.exports = function withLowMemoryGradle(config) {
  return withGradleProperties(config, (cfg) => {
    setProp(cfg.modResults, 'org.gradle.workers.max', '2');
    setProp(cfg.modResults, 'org.gradle.parallel', 'false');
    setProp(cfg.modResults, 'org.gradle.jvmargs', '-Xmx2048m -XX:MaxMetaspaceSize=512m');
    return cfg;
  });
};
