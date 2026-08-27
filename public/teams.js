// Teams page translations. Kept separate so the shared translation dictionary remains reusable.
Object.assign(MESSAGES.en, {
  teams: "Teams",
  teamsSubtitle:
    "Manage Teams and cross-Team membership. Team-specific roles are managed inside each Team.",
  createTeam: "Create Team",
  openTeam: "Open Team",
  memberCount: "{count} members",
  slug: "Slug",
  create: "Create",
  created: "Created",
  addExistingPerson: "Add existing person",
  selectPerson: "Select person…",
  saveTeam: "Save Team",
  deleteTeam: "Delete Team",
  removePerson: "Remove",
  removeAllEvents: "Remove all events",
  removeAllAttendance: "Remove all attendance",
  removeAllEventsConfirm:
    "Remove all events from this Team? This also removes all attendance and staff assignments for those events. This cannot be undone.",
  removeAllAttendanceConfirm:
    "Remove all attendance information from all events in this Team? This cannot be undone.",
  deleteTeamConfirm:
    "Delete this Team and all its events? People who belong to no other Team will also be deleted.",
  removePersonConfirm: "Remove this person from the Team?",
  teamSaved: "Team saved",
  teamDeleted: "Team deleted",
  eventsRemoved: "All events removed",
  attendanceRemoved: "All attendance removed",
  teamCreateFailed: "Could not create Team.",
  teamSaveFailed: "Could not save Team.",
  teamDeleteFailed: "Could not delete Team.",
  teamDataActionFailed: "Could not complete the Team data action.",
  noTeams: "No Teams yet.",
});
Object.assign(MESSAGES["nl-BE"], {
  teams: "Teams",
  teamsSubtitle:
    "Beheer teams en teamoverschrijdend lidmaatschap. Teamspecifieke rollen worden binnen elk team beheerd.",
  createTeam: "Team toevoegen",
  openTeam: "Team openen",
  memberCount: "{count} leden",
  slug: "Slug",
  create: "Toevoegen",
  created: "Aangemaakt",
  addExistingPerson: "Bestaande persoon toevoegen",
  selectPerson: "Selecteer persoon…",
  saveTeam: "Team opslaan",
  deleteTeam: "Team verwijderen",
  removePerson: "Verwijderen",
  removeAllEvents: "Alle events verwijderen",
  removeAllAttendance: "Alle aanwezigheid verwijderen",
  removeAllEventsConfirm:
    "Alle events van dit team verwijderen? Dit verwijdert ook alle aanwezigheid en staff-toewijzingen voor deze events. Dit kan niet ongedaan worden gemaakt.",
  removeAllAttendanceConfirm:
    "Alle aanwezigheidsinformatie van alle events van dit team verwijderen? Dit kan niet ongedaan worden gemaakt.",
  deleteTeamConfirm:
    "Dit team en alle bijbehorende events verwijderen? Personen die geen ander team hebben, worden ook verwijderd.",
  removePersonConfirm: "Deze persoon uit het team verwijderen?",
  teamSaved: "Team opgeslagen",
  teamDeleted: "Team verwijderd",
  eventsRemoved: "Alle events verwijderd",
  attendanceRemoved: "Alle aanwezigheid verwijderd",
  teamCreateFailed: "Team kon niet worden aangemaakt.",
  teamSaveFailed: "Team kon niet worden opgeslagen.",
  teamDeleteFailed: "Team kon niet worden verwijderd.",
  teamDataActionFailed: "Teamactie kon niet worden uitgevoerd.",
  noTeams: "Nog geen teams.",
});

// Bootstrap the shared hierarchical navigation on the Teams page.
const navigationCss = document.createElement("link");
navigationCss.rel = "stylesheet";
navigationCss.href = "/navigation.css";
document.head.appendChild(navigationCss);
const navigationScript = document.createElement("script");
navigationScript.src = "/navigation.js";
document.body.appendChild(navigationScript);
