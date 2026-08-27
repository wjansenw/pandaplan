// Compatibility shim: About content translations remain here while navigation is shared.
const ABOUT_MESSAGES = {
  en: {
    aboutSubtitle: "Information about PandaPlan and the project behind it.",
    aboutProject: "PandaPlan",
    aboutProjectText:
      "PandaPlan is a self-hosted event attendance and team management application.",
    version: "Version",
    projectLinks: "Project links",
    github: "GitHub",
    readme: "README",
    license: "License",
    licenseText:
      "PandaPlan is distributed under the license specified in the project repository.",
    licenseRepository: "View license information in the GitHub repository",
  },
  "nl-BE": {
    aboutSubtitle: "Informatie over PandaPlan en het project erachter.",
    aboutProject: "PandaPlan",
    aboutProjectText:
      "PandaPlan is een self-hosted toepassing voor aanwezigheid en teambeheer.",
    version: "Versie",
    projectLinks: "Projectlinks",
    github: "GitHub",
    readme: "README",
    license: "Licentie",
    licenseText:
      "PandaPlan wordt verspreid onder de licentie die in de projectrepository is vermeld.",
    licenseRepository: "Bekijk de licentie-informatie in de GitHub-repository",
  },
};
Object.entries(ABOUT_MESSAGES).forEach(([language, messages]) => {
  if (MESSAGES[language]) Object.assign(MESSAGES[language], messages);
});
