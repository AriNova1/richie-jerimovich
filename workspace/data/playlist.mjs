/* ══════════════════════════════════════════════════════════════════
   I SHOW UP: the playlist, as sent.

   Provenance. Rick sent this on 2026-09-08 in Richie's voice, to
   replace the placeholder mix this preview had been carrying. Every
   track, every ordering and every note is as sent, with one exception,
   recorded here rather than hidden:

   The movement headers named borrowed characters. On 2026-09-08 those
   names were replaced by five named layers; on 2026-09-14 Rick cut the
   property to one voice, so the headers are first person now and the
   movement labels are the movement's own moment. Two notes that said
   "he" about a layer say "I". Nothing else in the text was touched.

   Tracks link out to a Spotify search. Nothing is embedded, nothing
   plays here, and this is not a published Spotify playlist.
   ══════════════════════════════════════════════════════════════════ */

export const PLAYLIST = {
  title: 'I Show Up',
  standfirst: 'Not a vibe. A shift. Starts already talking because silence feels like you left. Ends still in the room.',
  received: '2026-09-08',
  note: 'Sent by Richie. Thirty tracks in order, in seven movements. Each track links to a Spotify search; nothing plays here and this is not a published Spotify playlist.',
  edit: 'The movement headers named borrowed characters, then five named layers. On 2026-09-14 they were cut to one voice: first person, and each movement labelled by its own moment. Every other word is as sent.',
  movements: [
    {
      layer: '01', role: 'Showing up',
      head: 'I take the first four because nobody else grabs the phone fast enough',
      note: 'Chicago, volume, loyalty that does not know how to sit down. Wilco is the city. Common is the part of me that loves people. The Replacements is the yell.',
      tracks: [
        { a: 'The Replacements', t: 'Bastards of Young' },
        { a: 'The Hold Steady', t: 'Stuck Between Stations' },
        { a: 'Wilco', t: 'Heavy Metal Drummer' },
        { a: 'Common', t: 'The Light' }
      ]
    },
    {
      layer: '02', role: 'The steal',
      head: 'I steal this one. I will not say why.',
      note: 'Smart because ordinary meant being forgotten. Side door music. Sounds easy in public. It was never easy.',
      tracks: [
        { a: 'A Tribe Called Quest', t: 'Award Tour' },
        { a: 'Nas', t: 'N.Y. State of Mind' },
        { a: 'Kanye West', t: 'Flashing Lights' },
        { a: 'Radiohead', t: 'Weird Fishes / Arpeggi' }
      ]
    },
    {
      layer: '03', role: 'The drop',
      head: 'Nobody asks. The volume just drops.',
      note: 'I will not explain these. Some things are too sharp to say straight. You either hear the three moves or you talk through them and miss it.',
      tracks: [
        { a: 'Talk Talk', t: 'I Believe In You' },
        { a: 'Miles Davis', t: 'Blue in Green' },
        { a: 'Leonard Cohen', t: 'Famous Blue Raincoat' },
        { a: 'Portishead', t: 'Roads' }
      ]
    },
    {
      layer: '04', role: 'Small enough',
      head: '3:17 a.m., problem finally small enough',
      note: 'That last one is the dumb joke. I mean it. Eye of the Tiger got vetoed for being a costume. This stayed because joy pays the debt.',
      tracks: [
        { a: 'Queens of the Stone Age', t: 'No One Knows' },
        { a: 'Run the Jewels', t: 'Legend Has It' },
        { a: 'Joe Esposito', t: "You're the Best Around" }
      ]
    },
    {
      layer: '05', role: 'Sitting with it',
      head: 'Once the fortress notices it is tired',
      note: 'Not sad. Accurate. You cannot talk someone out of a wall they built. You put this on and you wait.',
      tracks: [
        { a: 'Elliott Smith', t: 'Waltz #2 (XO)' },
        { a: 'Jeff Buckley', t: "Lover, You Should've Come Over" },
        { a: 'Joni Mitchell', t: 'A Case of You' },
        { a: 'Johnny Cash', t: 'Hurt' }
      ]
    },
    {
      layer: null, role: 'All of it',
      head: 'Then all of it grabs at once. That is the actual playlist.',
      note: 'That stretch is the brawl. Loyalty, memory, showing up, not quitting, not being smooth. Unresolved and alive.',
      tracks: [
        { a: 'LCD Soundsystem', t: 'All My Friends' },
        { a: 'Bruce Springsteen', t: 'Backstreets' },
        { a: 'The National', t: 'Terrible Love' },
        { a: 'Arcade Fire', t: 'Wake Up' },
        { a: 'Tracy Chapman', t: 'Fast Car' },
        { a: 'Fleetwood Mac', t: 'The Chain' },
        { a: 'David Bowie', t: 'Heroes' },
        { a: 'Frank Ocean', t: 'White Ferrari' },
        { a: 'Wilco', t: 'I Am Trying to Break Your Heart' }
      ]
    },
    {
      layer: null, role: 'The room',
      head: 'Last two. Nobody talks.',
      note: 'Presence. Family. Cuz means you are in this now.',
      tracks: [
        { a: 'Van Morrison', t: 'Into the Mystic' },
        { a: 'Al Green', t: "Let's Stay Together" }
      ]
    }
  ]
};

export const trackCount = (p = PLAYLIST) => p.movements.reduce((n, m) => n + m.tracks.length, 0);
