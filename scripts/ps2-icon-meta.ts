/** Per-game studio, city, and first PlayStation 2 release. */

export const COLLECTION_DESCRIPTION =
  "[https://www.youtube.com/watch?v=AIcuALGM1TI&t=40s](https://www.youtube.com/watch?v=AIcuALGM1TI&t=40s)\n\n[https://vt.tiktok.com/ZSqNJo4Nn/](https://vt.tiktok.com/ZSqNJo4Nn/)";

export interface GameMeta {
  manufacturer: string;
  manufactureLocation: string;
  releaseDate: string;
}

/** Action Replay MAX / POWERSAVE cube — not a real game icon. */
export const AR_PLACEHOLDER_IDS = [
  'ape-escape-2',
  'bmx-2-save-game',
  'fmx-global',
  'gt3-game-data',
  'herdy-gerdy000042',
  'klonoa2lunateas-veil',
  'nfshp2',
  'rc-revenge-pro-saved-game',
  'resident-evilcodeveronicax',
  'silent-hill-3-file-icon',
  'smugglers-run-2hostileterritory',
  'spyro-enter-the-dragonfly',
  'terminator',
  'tm-black',
  'ty-the-tasmanian-tiger',
  'zone-of-the-enders',
] as const;

/** SHA-1 prefix of the AR cube's encoded PNG (36-vertex blue MAX / POWERSAVE / AR). */
export const AR_PLACEHOLDER_PNG_SHA1 = '6977e75f50e9';

export const GAME_META: Record<string, GameMeta> = {
  'ac04save-data': { manufacturer: 'Namco', manufactureLocation: 'Tokyo, Japan', releaseDate: '2001 September 13' },
  'beyond-good-evil': { manufacturer: 'Ubisoft Montpellier', manufactureLocation: 'Montpellier, France', releaseDate: '2003 November 11' },
  'canis-canem-edit': { manufacturer: 'Rockstar Vancouver', manufactureLocation: 'Vancouver, Canada', releaseDate: '2006 October 17' },
  'cel-damage-eduardo': { manufacturer: 'Pseudo Interactive', manufactureLocation: 'Toronto, Canada', releaseDate: '2003 February 14' },
  'desa-gameeduardo': { manufacturer: 'Toys for Bob', manufactureLocation: 'Novato, California', releaseDate: '2003 September 4' },
  'zneo': { manufacturer: 'Spike', manufactureLocation: 'Tokyo, Japan', releaseDate: '2006 October 12' },
  'd3-profileeduardo': { manufacturer: 'Cavia', manufactureLocation: 'Tokyo, Japan', releaseDate: '2003 September 11' },
  'enter-the-matrix': { manufacturer: 'Shiny Entertainment', manufactureLocation: 'Newport Beach, California', releaseDate: '2003 May 15' },
  'futurama': { manufacturer: 'Unique Development Studios', manufactureLocation: 'Norrköping, Sweden', releaseDate: '2003 August 5' },
  'gran-turismo-4game-data': { manufacturer: 'Polyphony Digital', manufactureLocation: 'Tokyo, Japan', releaseDate: '2004 December 28' },
  'gta3': { manufacturer: 'DMA Design', manufactureLocation: 'Edinburgh, Scotland', releaseDate: '2001 October 23' },
  'sanandreas': { manufacturer: 'Rockstar North', manufactureLocation: 'Edinburgh, Scotland', releaseDate: '2004 October 26' },
  'gta-vicecity': { manufacturer: 'Rockstar North', manufactureLocation: 'Edinburgh, Scotland', releaseDate: '2002 October 27' },
  'gta-vcs': { manufacturer: 'Rockstar Leeds', manufactureLocation: 'Leeds, England', releaseDate: '2007 March 6' },
  'harry-potter-pda': { manufacturer: 'Eurocom', manufactureLocation: 'Derby, England', releaseDate: '2002 November 15' },
  'harrypotter': { manufacturer: 'Warthog Games', manufactureLocation: 'Manchester, England', releaseDate: '2003 December 12' },
  'harry-potter-pf': { manufacturer: 'Warthog Games', manufactureLocation: 'Manchester, England', releaseDate: '2003 December 12' },
  'jak-3': { manufacturer: 'Naughty Dog', manufactureLocation: 'Santa Monica, California', releaseDate: '2004 November 9' },
  'jak-and-daxter': { manufacturer: 'Naughty Dog', manufactureLocation: 'Santa Monica, California', releaseDate: '2001 December 3' },
  'jak-ii': { manufacturer: 'Naughty Dog', manufactureLocation: 'Santa Monica, California', releaseDate: '2003 October 14' },
  'killzoneeduardo': { manufacturer: 'Guerrilla Games', manufactureLocation: 'Amsterdam, Netherlands', releaseDate: '2004 November 2' },
  'king-kong': { manufacturer: 'Ubisoft Montpellier', manufactureLocation: 'Montpellier, France', releaseDate: '2005 November 22' },
  'maximo2e': { manufacturer: 'Capcom Production Studio 8', manufactureLocation: 'Sunnyvale, California', releaseDate: '2003 September 18' },
  'moheaeduardo': { manufacturer: 'EA Los Angeles', manufactureLocation: 'Los Angeles, California', releaseDate: '2005 June 7' },
  'moh-frontline-eduardo': { manufacturer: 'EA Los Angeles', manufactureLocation: 'Los Angeles, California', releaseDate: '2002 May 29' },
  'moh-rising-sunben': { manufacturer: 'EA Los Angeles', manufactureLocation: 'Los Angeles, California', releaseDate: '2003 November 11' },
  'moh-vanguardeduardo': { manufacturer: 'EA Los Angeles', manufactureLocation: 'Los Angeles, California', releaseDate: '2007 March 26' },
  'mgs2-15525plant-cleared': { manufacturer: 'Konami Computer Entertainment Japan', manufactureLocation: 'Tokyo, Japan', releaseDate: '2001 November 13' },
  'mgs3-game-data001': { manufacturer: 'Konami Computer Entertainment Japan', manufactureLocation: 'Tokyo, Japan', releaseDate: '2004 November 17' },
  'metalslug3': { manufacturer: 'SNK Playmore', manufactureLocation: 'Osaka, Japan', releaseDate: '2003 March 19' },
  'mmv4-options': { manufacturer: 'Supersonic Software', manufactureLocation: 'Royal Leamington Spa, England', releaseDate: '2006 June 27' },
  'motogp3file1': { manufacturer: 'Namco', manufactureLocation: 'Tokyo, Japan', releaseDate: '2003 February 27' },
  'need-for-speed-underground': { manufacturer: 'EA Black Box', manufactureLocation: 'Vancouver, Canada', releaseDate: '2003 November 17' },
  'nfsu-2eduardo': { manufacturer: 'EA Black Box', manufactureLocation: 'Vancouver, Canada', releaseDate: '2004 November 9' },
  'outrun-2006coast2coast': { manufacturer: 'Sumo Digital', manufactureLocation: 'Sheffield, England', releaseDate: '2006 March 31' },
  'prince-of-persiasot-00-0332': { manufacturer: 'Ubisoft Montreal', manufactureLocation: 'Montreal, Canada', releaseDate: '2003 November 10' },
  'ratchet-clank': { manufacturer: 'Insomniac Games', manufactureLocation: 'Burbank, California', releaseDate: '2002 November 4' },
  'ratchet-clank-2': { manufacturer: 'Insomniac Games', manufactureLocation: 'Burbank, California', releaseDate: '2003 November 11' },
  'ratchet-clank-3': { manufacturer: 'Insomniac Games', manufactureLocation: 'Burbank, California', releaseDate: '2004 November 3' },
  'ratchet-clanksize-matters': { manufacturer: 'High Impact Games', manufactureLocation: 'Burbank, California', releaseDate: '2008 March 11' },
  'ratchet-gladiator': { manufacturer: 'Insomniac Games', manufactureLocation: 'Burbank, California', releaseDate: '2005 October 25' },
  'rez': { manufacturer: 'United Game Artists', manufactureLocation: 'Tokyo, Japan', releaseDate: '2001 November 22' },
  'secret-agent-clank': { manufacturer: 'High Impact Games', manufactureLocation: 'Burbank, California', releaseDate: '2009 May 26' },
  'shadowof-the-colossus': { manufacturer: 'Team Ico', manufactureLocation: 'Tokyo, Japan', releaseDate: '2005 October 18' },
  'silent-hill-3-file': { manufacturer: 'Team Silent', manufactureLocation: 'Tokyo, Japan', releaseDate: '2003 May 23' },
  'sly-2': { manufacturer: 'Sucker Punch Productions', manufactureLocation: 'Bellevue, Washington', releaseDate: '2004 September 14' },
  'sly-3': { manufacturer: 'Sucker Punch Productions', manufactureLocation: 'Bellevue, Washington', releaseDate: '2005 September 26' },
  'sly-raccoon': { manufacturer: 'Sucker Punch Productions', manufactureLocation: 'Bellevue, Washington', releaseDate: '2002 September 23' },
  'smugglers-run': { manufacturer: 'Angel Studios', manufactureLocation: 'Carlsbad, California', releaseDate: '2000 October 26' },
  'spiderman-2': { manufacturer: 'Treyarch', manufactureLocation: 'Santa Monica, California', releaseDate: '2004 June 28' },
  'splinter-cell': { manufacturer: 'Ubisoft Shanghai', manufactureLocation: 'Shanghai, China', releaseDate: '2003 April 8' },
  'tekken-4': { manufacturer: 'Namco', manufactureLocation: 'Tokyo, Japan', releaseDate: '2002 March 28' },
  'tekken-5': { manufacturer: 'Namco', manufactureLocation: 'Tokyo, Japan', releaseDate: '2005 February 24' },
  'the-getaway': { manufacturer: 'Team Soho', manufactureLocation: 'London, England', releaseDate: '2002 December 11' },
  'the-returnof-the-king': { manufacturer: 'EA Redwood Shores', manufactureLocation: 'Redwood City, California', releaseDate: '2003 November 5' },
  'timesplitters-2saved-maps': { manufacturer: 'Free Radical Design', manufactureLocation: 'Nottingham, England', releaseDate: '2002 October 8' },
  'tomb-raideraodsave-data': { manufacturer: 'Core Design', manufactureLocation: 'Derby, England', releaseDate: '2003 June 20' },
  'thaw-progresseduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2005 October 18' },
  'thaw-graphicgrafiti': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2005 October 18' },
  'thps3-skatereduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2001 November 15' },
  'thps3-options-and-pro-careers': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2001 November 15' },
  'thps4-skatereduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2002 October 23' },
  'thps4-careereduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2002 October 23' },
  'thug-skatereduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2003 October 27' },
  'thug-2-skatereduardo': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2004 October 4' },
  'thug-2-graphicgraphic': { manufacturer: 'Neversoft', manufactureLocation: 'Woodland Hills, California', releaseDate: '2004 October 4' },
  'xiii-dataxiii': { manufacturer: 'Ubisoft Paris', manufactureLocation: 'Paris, France', releaseDate: '2003 November 18' },
};
