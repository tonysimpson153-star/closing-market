const { withProjectBuildGradle } = require("expo/config-plugins");

const KAKAO_MAVEN_URL = "https://devrepo.kakao.com/nexus/content/groups/public/";

/**
 * Adds Kakao's Android Maven repository to the root Gradle allprojects block.
 * Kakao SDK artifacts are not published to Maven Central or Google's repository.
 */
module.exports = function withKakaoMavenRepository(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("Kakao Maven repository plugin requires a Groovy build.gradle file.");
    }

    const contents = config.modResults.contents;
    if (contents.includes(KAKAO_MAVEN_URL)) {
      return config;
    }

    const repositoriesBlock = /allprojects\s*\{[\s\S]*?repositories\s*\{/;
    if (!repositoriesBlock.test(contents)) {
      throw new Error("Could not find allprojects.repositories in the root build.gradle.");
    }

    config.modResults.contents = contents.replace(
      repositoriesBlock,
      (match) => `${match}\n    maven { url "${KAKAO_MAVEN_URL}" }`,
    );
    return config;
  });
};
