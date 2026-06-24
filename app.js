(function (global) {
  "use strict";

  const MOSCOW_DEFAULTS = {
    city: "Moscow",
    lat: 55.7558,
    lng: 37.6173,
    timezone: "Europe/Moscow",
  };

  const PRESET_BASE = {
    sparse: 1,
    natural: 2,
    dense: 10,
  };

  const TIME_WINDOW_MULTIPLIER = {
    pre_dawn: 1.35,
    dawn_core: 1.9,
    dawn_settle: 1.25,
    day: 0.45,
    dusk_approach: 0.85,
    dusk_soft: 0.65,
    night: 0.08,
  };

  const SEASON_MULTIPLIER = {
    spring: 1.35,
    summer: 1.1,
    autumn: 0.65,
    winter: 0.45,
  };

  const ROOM_PLAYBACK_BOOST_DB = 14;
  const AMBIENT_BED_DB = -35;
  const EARLY_DAWN_SPECIES = new Set([
    "common_blackbird",
    "blackbird",
    "european_robin",
    "eurasian_wren",
    "song_thrush",
    "redwing",
  ]);
  const LATE_DAWN_SPECIES = new Set([
    "great_tit",
    "eurasian_blue_tit",
    "coal_tit",
    "common_chaffinch",
    "eurasian_nuthatch",
    "eurasian_blackcap",
    "garden_warbler",
    "eurasian_treecreeper",
  ]);
  const DUSK_SPECIES = new Set(["common_blackbird", "blackbird", "european_robin", "song_thrush", "redwing"]);
  const NIGHT_EDGE_SPECIES = new Set(["european_robin", "common_blackbird", "blackbird"]);

  const CLIP_LIBRARY = [
    {
      clipId: "great_tit_city_01",
      speciesId: "great_tit",
      ru: "Большая синица",
      en: "Great Tit",
      behavior: "pair_small",
      activeWindows: ["pre_dawn", "dawn_core", "dawn_settle", "day", "dusk_approach"],
      seasons: ["spring", "summer", "autumn", "winter"],
      baseWeight: 1.45,
      maxConcurrent: 2,
      frequency: 3200,
      sourceUrl: "https://xeno-canto.org/species/Parus-major",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "blackbird_dawn_01",
      speciesId: "blackbird",
      ru: "Чёрный дрозд",
      en: "Common Blackbird",
      behavior: "solo",
      activeWindows: ["pre_dawn", "dawn_core", "dawn_settle", "dusk_approach", "dusk_soft"],
      seasons: ["spring", "summer", "autumn"],
      baseWeight: 1.1,
      maxConcurrent: 1,
      frequency: 1950,
      sourceUrl: "https://xeno-canto.org/species/Turdus-merula",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "chaffinch_spring_01",
      speciesId: "chaffinch",
      ru: "Зяблик",
      en: "Common Chaffinch",
      behavior: "pair_small",
      activeWindows: ["pre_dawn", "dawn_core", "dawn_settle", "day"],
      seasons: ["spring", "summer", "autumn"],
      baseWeight: 1.25,
      maxConcurrent: 2,
      frequency: 4100,
      sourceUrl: "https://xeno-canto.org/species/Fringilla-coelebs",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "house_sparrow_flock_01",
      speciesId: "house_sparrow",
      ru: "Домовый воробей",
      en: "House Sparrow",
      behavior: "flock",
      activeWindows: ["dawn_core", "dawn_settle", "day", "dusk_approach"],
      seasons: ["spring", "summer", "autumn", "winter"],
      baseWeight: 1.55,
      maxConcurrent: 5,
      frequency: 2500,
      sourceUrl: "https://xeno-canto.org/species/Passer-domesticus",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "starling_city_01",
      speciesId: "starling",
      ru: "Скворец",
      en: "European Starling",
      behavior: "flock",
      activeWindows: ["dawn_core", "dawn_settle", "day"],
      seasons: ["spring", "summer", "autumn"],
      baseWeight: 0.9,
      maxConcurrent: 4,
      frequency: 2350,
      sourceUrl: "https://xeno-canto.org/species/Sturnus-vulgaris",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "jay_forest_01",
      speciesId: "jay",
      ru: "Сойка",
      en: "Eurasian Jay",
      behavior: "pair_small",
      activeWindows: ["pre_dawn", "dawn_core", "dawn_settle", "day", "dusk_approach"],
      seasons: ["spring", "summer", "autumn", "winter"],
      baseWeight: 0.8,
      maxConcurrent: 2,
      frequency: 1800,
      sourceUrl: "https://xeno-canto.org/species/Garrulus-glandarius",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "wood_pigeon_01",
      speciesId: "wood_pigeon",
      ru: "Вяхирь",
      en: "Common Wood Pigeon",
      behavior: "pair_small",
      activeWindows: ["dawn_core", "dawn_settle", "day", "dusk_approach", "dusk_soft"],
      seasons: ["spring", "summer", "autumn", "winter"],
      baseWeight: 0.95,
      maxConcurrent: 2,
      frequency: 920,
      sourceUrl: "https://xeno-canto.org/species/Columba-palumbus",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
    {
      clipId: "bullfinch_winter_01",
      speciesId: "bullfinch",
      ru: "Снегирь",
      en: "Eurasian Bullfinch",
      behavior: "pair_small",
      activeWindows: ["pre_dawn", "dawn_core", "day"],
      seasons: ["autumn", "winter"],
      baseWeight: 1.0,
      maxConcurrent: 2,
      frequency: 1430,
      sourceUrl: "https://xeno-canto.org/species/Pyrrhula-pyrrhula",
      sourceLabel: "Xeno-canto sample pack",
      recordist: "Curated local sample",
      license: "CC BY-NC-SA 4.0",
    },
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function dbToGain(db) {
    return Math.pow(10, db / 20);
  }

  function hashString(input) {
    let hash = 2166136261;
    const text = String(input);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRng(seed) {
    let state = seed >>> 0;
    return function next() {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function cloneDate(date) {
    return new Date(date.getTime());
  }

  function monthSeason(date) {
    const month = date.getMonth();
    if (month === 11 || month <= 1) return "winter";
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    return "autumn";
  }

  function formatDistanceLabel(distanceM) {
    if (distanceM <= 4) return "close, near window";
    if (distanceM <= 10) return "room-edge";
    if (distanceM <= 18) return "mid-room";
    return "far, softened";
  }

  function buildAttribution(item) {
    return `${item.recordist} · ${item.license} · ${item.sourceLabel}`;
  }

  function normalizePhraseSequence(sequence) {
    if (!Array.isArray(sequence)) return [];
    return sequence
      .map((phrase) => {
        const startSec = Number(phrase.start_sec ?? phrase.startSec);
        const endSec = Number(phrase.end_sec ?? phrase.endSec);
        const durationSec = Number(phrase.duration_sec ?? phrase.durationSec ?? (endSec - startSec));
        const gapAfterSec = Number(phrase.gap_after_sec ?? phrase.gapAfterSec ?? 0);
        if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || !Number.isFinite(durationSec)) return null;
        if (startSec < 0 || endSec <= startSec || durationSec <= 0) return null;
        return {
          startSec: round(startSec, 3),
          endSec: round(endSec, 3),
          durationSec: round(Math.min(durationSec, endSec - startSec), 3),
          gapAfterSec: Number.isFinite(gapAfterSec) ? round(Math.max(0, gapAfterSec), 3) : 0,
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.startSec - right.startSec);
  }

  function manifestToClipLibrary(manifest) {
    const manifestClips = Array.isArray(manifest?.clips) ? manifest.clips : [];
    if (!manifestClips.length) return CLIP_LIBRARY;
    return manifestClips.map((clip, index) => {
      const fallback = CLIP_LIBRARY.find((item) => item.speciesId === clip.species_id) || CLIP_LIBRARY[index % CLIP_LIBRARY.length];
      return {
        clipId: clip.clip_id || fallback.clipId,
        speciesId: clip.species_id || fallback.speciesId,
        ru: clip.ru || fallback.ru,
        en: clip.en || fallback.en,
        behavior: clip.behavior || fallback.behavior,
        activeWindows: clip.active_windows || fallback.activeWindows,
        seasons: clip.seasons || fallback.seasons,
        baseWeight: clip.base_weight ?? fallback.baseWeight,
        maxConcurrent: clip.max_concurrent ?? (clip.behavior === "flock" ? 5 : clip.behavior === "pair_small" ? 2 : 1) ?? fallback.maxConcurrent,
        frequency: clip.frequency ?? fallback.frequency,
        sourceUrl: clip.source_url || fallback.sourceUrl,
        sourceLabel: clip.source_label || fallback.sourceLabel,
        recordist: clip.recordist || fallback.recordist,
        license: clip.license || fallback.license,
        durationSec: clip.duration_sec,
        clipGainDb: Number.isFinite(Number(clip.clip_gain_db)) ? Number(clip.clip_gain_db) : 0,
        audioQualityScore: Number.isFinite(Number(clip.audio_quality_score)) ? Number(clip.audio_quality_score) : null,
        filterProfile: clip.filter_profile || null,
        audioFile: clip.processed_file || clip.audio_file || null,
        fallbackFile: clip.fallback_file || null,
        attribution: clip.attribution || null,
        phraseSequence: normalizePhraseSequence(clip.phrase_sequence || clip.phraseSequence),
      };
    });
  }

  function seasonalWindow(date, timeMode) {
    if (timeMode === "demo_dawn") {
      const minutes = date.getHours() * 60 + date.getMinutes();
      if (minutes < 220) return "pre_dawn";
      if (minutes < 270) return "dawn_core";
      if (minutes < 345) return "dawn_settle";
      if (minutes < 1080) return "day";
      if (minutes < 1150) return "dusk_approach";
      if (minutes < 1200) return "dusk_soft";
      return "night";
    }

    const season = monthSeason(date);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const sunriseBySeason = {
      winter: 500,
      spring: 275,
      summer: 255,
      autumn: 390,
    };
    const sunsetBySeason = {
      winter: 960,
      spring: 1220,
      summer: 1295,
      autumn: 1100,
    };
    const sunrise = sunriseBySeason[season];
    const sunset = sunsetBySeason[season];
    if (minutes < sunrise - 110) return "night";
    if (minutes < sunrise - 45) return "pre_dawn";
    if (minutes < sunrise + 20) return "dawn_core";
    if (minutes < sunrise + 100) return "dawn_settle";
    if (minutes < sunset - 75) return "day";
    if (minutes < sunset - 15) return "dusk_approach";
    if (minutes < sunset + 15) return "dusk_soft";
    return "night";
  }

  class BirdRadioScheduler {
    constructor(options = {}) {
      this.seed = options.seed ?? 1;
      this.preset = options.preset ?? "natural";
      this.timeMode = options.timeMode ?? "real_time";
      this.now = typeof options.now === "function" ? options.now : () => new Date();
      this.location = options.location ?? MOSCOW_DEFAULTS;
      this.clipLibrary = Array.isArray(options.clipLibrary) && options.clipLibrary.length ? options.clipLibrary : CLIP_LIBRARY;
    }

    getSeason(date = this.now()) {
      return monthSeason(date);
    }

    getTimeWindow(date = this.now()) {
      return seasonalWindow(cloneDate(date), this.timeMode);
    }

    getTargetConcurrency(date = this.now()) {
      const season = this.getSeason(date);
      const window = this.getTimeWindow(date);
      const base = PRESET_BASE[this.preset] ?? PRESET_BASE.natural;
      const target = Math.round(
        base * (SEASON_MULTIPLIER[season] ?? 1) * (TIME_WINDOW_MULTIPLIER[window] ?? 1)
      );
      if (window === "night") return clamp(target, 1, this.preset === "dense" ? 2 : 1);
      if (window === "dawn_core") return clamp(target, 2, 16);
      if (window === "pre_dawn" || window === "dawn_settle") return clamp(target, 1, 12);
      return clamp(target, 1, 8);
    }

    planNextEvents({ count, previousEvents = [], startOffsetSec = 0, date = this.now() } = {}) {
      const season = this.getSeason(date);
      const window = this.getTimeWindow(date);
      const total = count ?? this.getTargetConcurrency(date);
      const seedValue = hashString(
        [
          this.seed,
          this.preset,
          this.timeMode,
          season,
          window,
          total,
          startOffsetSec,
          JSON.stringify(previousEvents.map((event) => ({
            speciesId: event.speciesId,
            startSec: event.startSec,
            durationSec: event.durationSec,
          }))),
        ].join("|")
      );
      const rng = createRng(seedValue);
      const lastBySpecies = new Map();
      previousEvents.forEach((event) => {
        lastBySpecies.set(event.speciesId, event.startSec ?? 0);
      });

      const events = [];
      let cursor = startOffsetSec;
      for (let index = 0; index < total; index += 1) {
        const item = this.pickClip({ season, window, previousEvents, rng, lastBySpecies });
        const spacing = this.computeSpacing(window, index, rng);
        cursor += index === 0 ? round(rng() * 2.2, 2) : spacing;
        const distanceM = round(this.sampleDistance(window, rng), 1);
        const gainDb = round(this.computeGain(distanceM, item.behavior, item.clipGainDb), 1);
        const fadeInSec = round(clamp(0.25 + rng() * 1.6, 0.2, 2.5), 2);
        const fadeOutSec = round(clamp(0.6 + rng() * 2.4, 0.5, 4.0), 2);
        let durationSec = round(this.sampleDuration(item, window, rng), 2);
        const phraseSequence = this.samplePhraseSequence(item, durationSec, rng);
        if (phraseSequence.length) {
          durationSec = this.phraseSequenceDuration(phraseSequence);
        }
        const chorusSize = this.sampleChorusSize(item, window, rng);
        const pan = round(rng() * 1.6 - 0.8, 2);
        const event = {
          clipId: item.clipId,
          speciesId: item.speciesId,
          ru: item.ru,
          en: item.en,
          behavior: item.behavior,
          season,
          window,
          startSec: round(cursor, 2),
          durationSec,
          distanceM,
          distanceLabel: formatDistanceLabel(distanceM),
          gainDb,
          pan,
          chorusSize,
          chorusSpreadSec: chorusSize > 1 ? this.sampleChorusSpread(item, window, chorusSize, rng) : 0,
          fadeInSec,
          fadeOutSec,
          frequency: item.frequency,
          attribution: item.attribution || buildAttribution(item),
          sourceUrl: item.sourceUrl,
          license: item.license,
          sourceLabel: item.sourceLabel,
          audioFile: item.audioFile || null,
          fallbackFile: item.fallbackFile || null,
          phraseSequence,
        };
        events.push(event);
        lastBySpecies.set(item.speciesId, event.startSec);
        cursor += Math.max(0.2, durationSec * (this.preset === "dense" && window === "dawn_core" ? 0.035 : 0.14));
      }
      return events;
    }

    pickClip({ season, window, previousEvents, rng, lastBySpecies }) {
      const recentSpecies = previousEvents.slice(-4).map((event) => event.speciesId);
      const candidates = this.clipLibrary.filter((item) => {
        if (!item.seasons.includes(season)) return false;
        if (window === "night" && !NIGHT_EDGE_SPECIES.has(item.speciesId) && !item.activeWindows.includes("night")) {
          return false;
        }
        if (!item.activeWindows.includes(window) && window !== "night") {
          return false;
        }
        const lastSeen = lastBySpecies.get(item.speciesId);
        if (item.behavior === "solo" && typeof lastSeen === "number") {
          return false;
        }
        return true;
      });
      const pool = candidates.length ? candidates : this.clipLibrary.filter((item) => item.seasons.includes(season));
      const weighted = pool.map((item) => {
        let weight = item.baseWeight;
        if (window === "dawn_core") weight *= 1.5;
        if (window === "pre_dawn") weight *= EARLY_DAWN_SPECIES.has(item.speciesId) ? 2.2 : 0.65;
        if (window === "dawn_core" && EARLY_DAWN_SPECIES.has(item.speciesId)) weight *= 1.35;
        if (window === "dawn_core" && LATE_DAWN_SPECIES.has(item.speciesId)) weight *= 1.2;
        if (window === "dawn_settle") weight *= LATE_DAWN_SPECIES.has(item.speciesId) ? 1.25 : 0.95;
        if (window === "day") weight *= item.behavior === "flock" ? 0.9 : 0.62;
        if (window === "dusk_approach" || window === "dusk_soft") {
          weight *= DUSK_SPECIES.has(item.speciesId) ? 1.8 : 0.72;
        }
        if (window === "night") weight *= NIGHT_EDGE_SPECIES.has(item.speciesId) ? 0.55 : 0.04;
        if (recentSpecies.includes(item.speciesId)) weight *= 0.28;
        return { item, weight };
      });
      const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
      let threshold = rng() * total;
      for (const entry of weighted) {
        threshold -= entry.weight;
        if (threshold <= 0) return entry.item;
      }
      return weighted[weighted.length - 1].item;
    }

    computeSpacing(window, index, rng) {
      const baseSpacing = {
        pre_dawn: 10,
        dawn_core: 4.8,
        dawn_settle: 9,
        day: 42,
        dusk_approach: 18,
        dusk_soft: 16,
        night: 180,
      }[window] ?? 18;
      const presetMultiplier = {
        sparse: 1.35,
        natural: 1,
        dense: window === "dawn_core" ? 0.32 : 0.45,
      }[this.preset] ?? 1;
      const jitter = index === 0 ? 0 : (rng() - 0.5) * (window === "dawn_core" ? 3.2 : 6.5);
      const floor = window === "dawn_core" && this.preset === "dense" ? 0.8 : 2.2;
      return round(Math.max(floor, baseSpacing * presetMultiplier + jitter), 2);
    }

    sampleDistance(window, rng) {
      const bounds = {
        pre_dawn: [3, 14],
        dawn_core: [2, 16],
        dawn_settle: [4, 24],
        day: [6, 28],
        dusk_approach: [4, 20],
        dusk_soft: [6, 18],
        night: [10, 30],
      }[window] ?? [4, 18];
      return bounds[0] + rng() * (bounds[1] - bounds[0]);
    }

    sampleDuration(item, window, rng) {
      const base = {
        solo: [16, 38],
        pair_small: [14, 34],
        flock: [8, 22],
      }[item.behavior] ?? [8, 16];
      const windowBonus = {
        pre_dawn: 1.15,
        dawn_core: 1.55,
        dawn_settle: 1.25,
        day: 0.62,
        dusk_approach: 1.0,
        dusk_soft: 0.85,
        night: 0.45,
      }[window] ?? 1;
      const target = (base[0] + rng() * (base[1] - base[0])) * windowBonus;
      const clipLimit = typeof item.durationSec === "number" && item.durationSec > 0 ? item.durationSec * 0.92 : 28;
      const maxPhrase = window === "dawn_core" || window === "pre_dawn" ? 62 : 42;
      return clamp(target, 3.5, Math.max(3.5, Math.min(clipLimit, maxPhrase)));
    }

    phraseSequenceDuration(sequence) {
      if (!Array.isArray(sequence) || !sequence.length) return 0;
      const first = sequence[0];
      const last = sequence[sequence.length - 1];
      return round(Math.max(0.2, last.endSec - first.startSec), 2);
    }

    samplePhraseSequence(item, targetDurationSec, rng) {
      const sequence = Array.isArray(item.phraseSequence) ? item.phraseSequence : [];
      if (!sequence.length) return [];
      if (sequence.length === 1) return sequence.map((phrase) => ({ ...phrase }));
      const startMax = Math.max(0, sequence.length - 2);
      const startIndex = Math.floor(rng() * (startMax + 1));
      const selected = [];
      const firstStart = sequence[startIndex].startSec;
      const maxDuration = Math.max(0.25, targetDurationSec);
      for (let index = startIndex; index < sequence.length; index += 1) {
        const phrase = sequence[index];
        const span = phrase.endSec - firstStart;
        if (selected.length && span > maxDuration) break;
        selected.push({ ...phrase });
        if (selected.length >= 10 && span > maxDuration * 0.7) break;
      }
      return selected.length ? selected : [{ ...sequence[startIndex] }];
    }

    sampleChorusSize(item, window, rng) {
      if (window === "night") return 1;
      if (item.behavior === "flock") {
        const base = this.preset === "dense" ? 4 : this.preset === "natural" ? 2 : 1;
        const dawnBonus = window === "dawn_core" ? 2 : window === "dawn_settle" || window === "pre_dawn" ? 1 : 0;
        return clamp(base + dawnBonus + Math.floor(rng() * 2), 1, Math.max(1, item.maxConcurrent || 5));
      }
      if (item.behavior === "pair_small" && this.preset === "dense" && (window === "dawn_core" || window === "dawn_settle")) {
        return rng() > 0.55 ? 2 : 1;
      }
      return 1;
    }

    sampleChorusSpread(item, window, chorusSize, rng) {
      if (item.behavior === "flock") {
        const maxSpread = window === "dawn_core" ? 9.5 : window === "day" ? 5.5 : 7;
        return round(clamp(1.2 + rng() * maxSpread + chorusSize * 0.35, 1.0, 12.0), 2);
      }
      return round(clamp(1.4 + rng() * 3.2, 0.8, 5.5), 2);
    }

    computeGain(distanceM, behavior, clipGainDb = 0) {
      const base = behavior === "flock" ? -9 : behavior === "solo" ? -8 : -7.5;
      const gain = base - 20 * Math.log10(distanceM) - distanceM * 0.14 + ROOM_PLAYBACK_BOOST_DB + clipGainDb;
      return clamp(gain, -20, -4);
    }

    describeState(date = this.now()) {
      const season = this.getSeason(date);
      const window = this.getTimeWindow(date);
      return {
        season,
        window,
        preset: this.preset,
        targetConcurrency: this.getTargetConcurrency(date),
        location: this.location,
      };
    }
  }

  function createPlayerState(root, manifest) {
    const clipLibrary = manifestToClipLibrary(manifest);
    const state = {
      root,
      manifest,
      clipLibrary,
      audioContext: null,
      masterGain: null,
      wakeLock: null,
      scheduler: new BirdRadioScheduler({
        seed: manifest.seed ?? 1,
        preset: manifest.defaultPreset ?? "natural",
        timeMode: manifest.defaultTimeMode ?? "real_time",
        clipLibrary,
      }),
      pendingEvents: [],
      history: [],
      playing: false,
      lookaheadSec: 8,
      queueCursorSec: 0,
      sessionStartTime: 0,
      timer: null,
      status: "idle",
      volume: 0.55,
      activeNodes: new Set(),
      ambientNodes: null,
      ambientGain: null,
      ambientBuffer: null,
      bufferCache: new Map(),
      maxCachedBuffers: 12,
    };
    return state;
  }

  function buildManifestSource() {
    return {
      seed: 7,
      defaultPreset: "natural",
      defaultTimeMode: "real_time",
      clips: CLIP_LIBRARY.map((item) => ({
        clip_id: item.clipId,
        species_id: item.speciesId,
        ru: item.ru,
        en: item.en,
        behavior: item.behavior,
        duration_sec: 6,
        lufs_i: -23,
        true_peak_db: -1,
        recordist: item.recordist,
        license: item.license,
        source_url: item.sourceUrl,
        source_label: item.sourceLabel,
        attribution: buildAttribution(item),
      })),
    };
  }

  function renderApp(root, state) {
    root.innerHTML = `
      <div class="shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">bird-radio</p>
            <h1>Bird Radio</h1>
          </div>
          <div class="status-pill" data-status>Pilot idle</div>
        </header>
        <main class="workspace">
          <section class="control-band" aria-label="Player controls">
            <div class="primary-actions">
              <button type="button" class="action action-start" data-start>Start</button>
              <button type="button" class="action action-stop" data-stop>Stop</button>
            </div>
            <label class="field">
              <span>Volume</span>
              <input type="range" min="0" max="100" value="55" data-volume>
            </label>
            <label class="field">
              <span>Preset</span>
              <select data-preset>
                <option value="sparse">Sparse</option>
                <option value="natural" selected>Natural</option>
                <option value="dense">Dense</option>
              </select>
            </label>
            <label class="field">
              <span>Time mode</span>
              <select data-time-mode>
                <option value="real_time" selected>Real time</option>
                <option value="demo_dawn">Demo dawn</option>
              </select>
            </label>
          </section>

          <section class="status-band" aria-label="Playback status">
            <div>
              <p class="section-title">Status</p>
              <p class="status-text" data-status-text>Idle. Tap Start to resume the room scene.</p>
            </div>
            <div>
              <p class="section-title">Now playing</p>
              <ul class="now-playing" data-now-playing></ul>
            </div>
          </section>

          <section class="attribution-band" aria-label="Attribution">
            <div class="attribution-head">
              <p class="section-title">Attribution</p>
              <p class="meta" data-mode-line>Moscow default profile</p>
            </div>
            <div class="attribution-list" data-attribution></div>
          </section>
        </main>
      </div>
    `;

    state.nodes = {
      statusPill: root.querySelector("[data-status]"),
      statusText: root.querySelector("[data-status-text]"),
      nowPlaying: root.querySelector("[data-now-playing]"),
      attribution: root.querySelector("[data-attribution]"),
      modeLine: root.querySelector("[data-mode-line]"),
      startButton: root.querySelector("[data-start]"),
      stopButton: root.querySelector("[data-stop]"),
      volume: root.querySelector("[data-volume]"),
      preset: root.querySelector("[data-preset]"),
      timeMode: root.querySelector("[data-time-mode]"),
    };
  }

  function renderNowPlaying(state) {
    const list = state.nodes.nowPlaying;
    const items = state.pendingEvents.slice(0, 4);
    if (!items.length) {
      list.innerHTML = `<li class="now-item muted">Waiting for the next cue.</li>`;
      return;
    }
    list.innerHTML = items
      .map((event, index) => {
        const lead = index === 0 ? "current" : `next +${round(event.startSec - items[0].startSec, 1)}s`;
        return `
          <li class="now-item">
            <span class="now-title">${event.ru}</span>
            <span class="now-meta">${event.distanceLabel} · ${lead}</span>
          </li>
        `;
      })
      .join("");
  }

  function renderAttribution(state) {
    const list = state.nodes.attribution;
    const items = state.pendingEvents.slice(0, 3);
    if (!items.length) {
      list.innerHTML = `<p class="muted">Attributions appear here when playback starts.</p>`;
      return;
    }
    list.innerHTML = items
      .map((event) => `
        <article class="attribution-item">
          <strong>${event.ru}</strong>
          <div>${event.attribution}</div>
          <div class="meta">${event.sourceUrl}</div>
        </article>
      `)
      .join("");
  }

  function updateStatus(state, status, text) {
    state.status = status;
    state.nodes.statusPill.textContent = status.replace(/_/g, " ");
    state.nodes.statusText.textContent = text;
    state.nodes.modeLine.textContent = `${state.scheduler.preset} preset · ${state.scheduler.timeMode.replace(/_/g, " ")} mode`;
  }

  function ensureAudio(state) {
    if (state.audioContext) return state.audioContext;
    const AudioContextCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextCtor) {
      throw new Error("Web Audio API is not available in this browser.");
    }
    state.audioContext = new AudioContextCtor();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = state.volume;
    state.masterGain.connect(state.audioContext.destination);
    return state.audioContext;
  }

  function applyVolume(state, value) {
    state.volume = value;
    if (state.masterGain) {
      state.masterGain.gain.setTargetAtTime(value, state.audioContext.currentTime, 0.02);
    }
  }

  function ambientGainValue() {
    return dbToGain(AMBIENT_BED_DB);
  }

  function createAmbientBuffer(audioContext) {
    const sampleRate = audioContext.sampleRate || 48000;
    const durationSec = 8;
    const frameCount = Math.floor(sampleRate * durationSec);
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let slow = 0;
    let mid = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const white = Math.random() * 2 - 1;
      slow = slow * 0.985 + white * 0.015;
      mid = mid * 0.72 + white * 0.28;
      data[index] = slow * 0.55 + mid * 0.25 + white * 0.08;
    }
    return buffer;
  }

  function startAmbientBed(state) {
    if (!state.audioContext || state.ambientNodes) return;
    const audioContext = state.audioContext;
    if (!state.ambientBuffer) {
      state.ambientBuffer = createAmbientBuffer(audioContext);
    }
    const source = audioContext.createBufferSource();
    const highpass = audioContext.createBiquadFilter();
    const lowpass = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime + 0.02;

    source.buffer = state.ambientBuffer;
    source.loop = true;
    highpass.type = "highpass";
    highpass.frequency.value = 180;
    highpass.Q.value = 0.7;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 4200;
    lowpass.Q.value = 0.55;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.setTargetAtTime(ambientGainValue(), startAt + 0.04, 1.4);

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(state.masterGain);
    source.start(startAt);

    state.ambientGain = gain;
    state.ambientNodes = { source, highpass, lowpass, gain };
  }

  function updateAmbientBed(state) {
    if (!state.ambientGain || !state.audioContext) return;
    state.ambientGain.gain.setTargetAtTime(ambientGainValue(), state.audioContext.currentTime, 1.2);
  }

  function stopAmbientBed(state) {
    if (!state.ambientNodes || !state.audioContext) return;
    const nodes = state.ambientNodes;
    const stopAt = state.audioContext.currentTime + 0.45;
    try {
      nodes.gain.gain.setTargetAtTime(0.0001, state.audioContext.currentTime, 0.18);
      nodes.source.stop(stopAt);
    } catch (error) {
      void error;
    }
    global.setTimeout(() => {
      try {
        nodes.source.disconnect();
        nodes.highpass.disconnect();
        nodes.lowpass.disconnect();
        nodes.gain.disconnect();
      } catch (error) {
        void error;
      }
    }, 700);
    state.ambientNodes = null;
    state.ambientGain = null;
  }

  function decodeAudioDataCompat(audioContext, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const result = audioContext.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
      if (result && typeof result.then === "function") {
        result.then(resolve, reject);
      }
    });
  }

  function trimBufferCache(state) {
    while (state.bufferCache.size > state.maxCachedBuffers) {
      const oldestKey = state.bufferCache.keys().next().value;
      state.bufferCache.delete(oldestKey);
    }
  }

  async function getAudioBuffer(state, audioFile) {
    if (!audioFile) return null;
    if (state.bufferCache.has(audioFile)) {
      const cached = state.bufferCache.get(audioFile);
      state.bufferCache.delete(audioFile);
      state.bufferCache.set(audioFile, cached);
      return cached;
    }
    const response = await fetch(audioFile, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Audio file failed: ${audioFile}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await decodeAudioDataCompat(state.audioContext, arrayBuffer);
    state.bufferCache.set(audioFile, buffer);
    trimBufferCache(state);
    return buffer;
  }

  function eventVoiceVariant(event, index, total) {
    if (index === 0) return event;
    const spread = event.chorusSpreadSec || 0.8;
    const side = index % 2 === 0 ? 1 : -1;
    const offset = round((spread / Math.max(1, total - 1)) * index, 2);
    return {
      ...event,
      startSec: event.startSec + offset,
      durationSec: Math.max(2.5, event.durationSec - offset * 0.35),
      pan: clamp(event.pan + side * (0.18 + index * 0.08), -0.95, 0.95),
      gainDb: clamp(event.gainDb - 2.2 - index * 0.9, -22, -5),
      fadeInSec: Math.min(event.fadeInSec + index * 0.08, 1.8),
    };
  }

  function createSyntheticVoice(state, event) {
    const audioContext = state.audioContext;
    const plannedStart = state.sessionStartTime + event.startSec;
    const startAt = Math.max(audioContext.currentTime + 0.02, plannedStart);
    const duration = event.durationSec;
    const gain = audioContext.createGain();
    const panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : audioContext.createPanner();
    const filter = audioContext.createBiquadFilter();
    const carrier = audioContext.createOscillator();
    const overtone = audioContext.createOscillator();

    filter.type = "bandpass";
    filter.frequency.value = event.frequency;
    filter.Q.value = event.behavior === "flock" ? 5 : 8;

    carrier.type = event.behavior === "solo" ? "triangle" : "sine";
    carrier.frequency.value = event.frequency;
    overtone.type = "sine";
    overtone.frequency.value = event.frequency * 1.98;

    const peakGain = Math.pow(10, event.gainDb / 20);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peakGain, startAt + Math.min(event.fadeInSec, duration * 0.45));
    gain.gain.setValueAtTime(peakGain, startAt + Math.max(0.12, duration - event.fadeOutSec));
    gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);

    if (panner.pan) {
      panner.pan.setValueAtTime(event.pan, startAt);
    } else {
      panner.positionX.value = event.pan;
    }

    carrier.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(state.masterGain);

    carrier.start(startAt);
    overtone.start(startAt);
    carrier.stop(startAt + duration + 0.2);
    overtone.stop(startAt + duration + 0.2);

    const nodeGroup = { carrier, overtone, gain, filter, panner };
    state.activeNodes.add(nodeGroup);
    const cleanupAt = (startAt + duration + 0.35 - audioContext.currentTime) * 1000;
    global.setTimeout(() => {
      state.activeNodes.delete(nodeGroup);
    }, Math.max(300, cleanupAt));
  }

  function createBufferSliceVoice(state, buffer, voiceEvent, startAt, offsetSec, durationSec) {
    const audioContext = state.audioContext;
    const safeOffset = Math.max(0, Math.min(offsetSec, Math.max(0, buffer.duration - 0.05)));
    const safeDuration = Math.max(0.05, Math.min(durationSec, buffer.duration - safeOffset));
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : audioContext.createPanner();

    source.buffer = buffer;
    const peakGain = Math.pow(10, voiceEvent.gainDb / 20);
    const fadeIn = Math.min(voiceEvent.fadeInSec, safeDuration * 0.35, 0.12);
    const fadeOut = Math.min(voiceEvent.fadeOutSec, safeDuration * 0.4, 0.18);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(peakGain, startAt + fadeIn);
    gain.gain.setValueAtTime(peakGain, startAt + Math.max(0.03, safeDuration - fadeOut));
    gain.gain.linearRampToValueAtTime(0.0001, startAt + safeDuration);

    if (panner.pan) {
      panner.pan.setValueAtTime(voiceEvent.pan, startAt);
    } else {
      panner.positionX.value = voiceEvent.pan;
    }

    source.connect(gain);
    gain.connect(panner);
    panner.connect(state.masterGain);
    source.start(startAt, safeOffset, safeDuration);
    source.stop(startAt + safeDuration + 0.2);

    const nodeGroup = { source, gain, panner };
    state.activeNodes.add(nodeGroup);
    const cleanupAt = (startAt + safeDuration + 0.35 - audioContext.currentTime) * 1000;
    source.onended = () => state.activeNodes.delete(nodeGroup);
    global.setTimeout(() => {
      state.activeNodes.delete(nodeGroup);
    }, Math.max(300, cleanupAt));
  }

  async function createVoice(state, event) {
    const audioContext = state.audioContext;
    const chorusSize = clamp(Math.round(event.chorusSize || 1), 1, 6);
    if (!event.audioFile || typeof fetch !== "function") {
      for (let index = 0; index < chorusSize; index += 1) {
        createSyntheticVoice(state, eventVoiceVariant(event, index, chorusSize));
      }
      return;
    }

    try {
      const buffer = await getAudioBuffer(state, event.audioFile);
      if (!state.playing || !buffer) return;
      for (let index = 0; index < chorusSize; index += 1) {
        const voiceEvent = eventVoiceVariant(event, index, chorusSize);
        const plannedStart = state.sessionStartTime + voiceEvent.startSec;
        const startAt = Math.max(audioContext.currentTime + 0.02, plannedStart);
        const phraseSequence = Array.isArray(voiceEvent.phraseSequence) ? voiceEvent.phraseSequence : [];
        if (phraseSequence.length) {
          const firstStart = phraseSequence[0].startSec;
          phraseSequence.forEach((phrase) => {
            const phraseStartAt = startAt + Math.max(0, phrase.startSec - firstStart);
            createBufferSliceVoice(state, buffer, voiceEvent, phraseStartAt, phrase.startSec, phrase.durationSec);
          });
        } else {
          const duration = Math.min(voiceEvent.durationSec, buffer.duration);
          createBufferSliceVoice(state, buffer, voiceEvent, startAt, 0, duration);
        }
      }
    } catch (error) {
      void error;
      for (let index = 0; index < chorusSize; index += 1) {
        createSyntheticVoice(state, eventVoiceVariant(event, index, chorusSize));
      }
    }
  }

  function scheduleBatch(state) {
    if (!state.playing || !state.audioContext) return;
    const audioTime = state.audioContext.currentTime;
    while (state.pendingEvents.length < 6) {
      const batch = state.scheduler.planNextEvents({
        count: state.scheduler.getTargetConcurrency(),
        previousEvents: state.history.slice(-12),
        startOffsetSec: state.queueCursorSec,
      });
      if (!batch.length) break;
      const normalizedBatch = batch;
      state.queueCursorSec = normalizedBatch[normalizedBatch.length - 1].startSec + normalizedBatch[normalizedBatch.length - 1].durationSec + 4;
      state.pendingEvents.push(...normalizedBatch);
      state.history.push(...normalizedBatch);
      if (state.history.length > 30) state.history.splice(0, state.history.length - 30);
      break;
    }

    const toPlay = state.pendingEvents.filter((event) => event.startSec <= audioTime - state.sessionStartTime + state.lookaheadSec);
    while (toPlay.length && state.pendingEvents.length) {
      const event = state.pendingEvents.shift();
      if (event.startSec > audioTime - state.sessionStartTime + state.lookaheadSec) {
        state.pendingEvents.unshift(event);
        break;
      }
      createVoice(state, event);
    }
    renderNowPlaying(state);
    renderAttribution(state);
  }

  async function startPlayback(state) {
    ensureAudio(state);
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }
    state.pendingEvents = [];
    state.history = [];
    state.queueCursorSec = 0;
    state.sessionStartTime = state.audioContext.currentTime + 0.1;
    state.playing = true;
    startAmbientBed(state);
    updateStatus(state, "playing", "Playing with continuous room bed and soft overlap.");
    renderNowPlaying(state);
    renderAttribution(state);
    scheduleBatch(state);
    if (state.timer) global.clearInterval(state.timer);
    state.timer = global.setInterval(() => scheduleBatch(state), 350);
    requestWakeLock(state);
    applyMediaSession(state);
  }

  function stopPlayback(state) {
    state.playing = false;
    stopAmbientBed(state);
    if (state.timer) {
      global.clearInterval(state.timer);
      state.timer = null;
    }
    for (const nodeGroup of state.activeNodes) {
      try {
        if (nodeGroup.source) nodeGroup.source.stop();
        if (nodeGroup.carrier) nodeGroup.carrier.stop();
        if (nodeGroup.overtone) nodeGroup.overtone.stop();
      } catch (error) {
        void error;
      }
      try {
        if (nodeGroup.source) nodeGroup.source.disconnect();
        if (nodeGroup.carrier) nodeGroup.carrier.disconnect();
        if (nodeGroup.overtone) nodeGroup.overtone.disconnect();
        if (nodeGroup.filter) nodeGroup.filter.disconnect();
        if (nodeGroup.gain) nodeGroup.gain.disconnect();
        if (nodeGroup.panner) nodeGroup.panner.disconnect();
      } catch (error) {
        void error;
      }
    }
    state.activeNodes.clear();
    state.pendingEvents = [];
    updateStatus(state, "idle", "Stopped. Tap Start to resume the room scene.");
    renderNowPlaying(state);
    renderAttribution(state);
    releaseWakeLock(state);
    applyMediaSession(state);
  }

  function requestWakeLock(state) {
    if (!global.navigator || !navigator.wakeLock || state.wakeLock) return;
    navigator.wakeLock.request("screen").then((lock) => {
      state.wakeLock = lock;
      lock.addEventListener("release", () => {
        state.wakeLock = null;
      });
    }).catch(() => {
      state.wakeLock = null;
    });
  }

  function releaseWakeLock(state) {
    if (state.wakeLock) {
      const lock = state.wakeLock;
      state.wakeLock = null;
      lock.release().catch(() => {});
    }
  }

  function applyMediaSession(state) {
    if (!global.navigator || !navigator.mediaSession) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: "Bird Radio",
        artist: state.pendingEvents[0]?.ru || "Moscow birds",
        album: state.scheduler.timeMode === "demo_dawn" ? "Demo dawn" : "Real time",
      });
      navigator.mediaSession.setActionHandler("play", () => startPlayback(state));
      navigator.mediaSession.setActionHandler("pause", () => stopPlayback(state));
      navigator.mediaSession.setActionHandler("stop", () => stopPlayback(state));
    } catch (error) {
      void error;
    }
  }

  function setStatusForLifecycle(state, status, text) {
    if (!state.nodes) return;
    updateStatus(state, status, text);
  }

  function initialize(root) {
    const manifest = global.BirdRadioManifest || buildManifestSource();
    const state = createPlayerState(root, manifest);
    renderApp(root, state);
    updateStatus(state, "idle", "Idle. Tap Start to resume the room scene.");
    renderNowPlaying(state);
    renderAttribution(state);

    state.nodes.startButton.addEventListener("click", () => {
      state.scheduler = new BirdRadioScheduler({
        seed: manifest.seed ?? 1,
        preset: state.nodes.preset.value,
        timeMode: state.nodes.timeMode.value,
        clipLibrary: state.clipLibrary,
      });
      state.pendingEvents = [];
      state.history = [];
      state.queueCursorSec = 0;
      try {
        startPlayback(state).catch((error) => {
          updateStatus(state, "error", error.message || "Playback failed to start.");
        });
      } catch (error) {
        updateStatus(state, "error", error.message || "Playback failed to start.");
      }
    });

    state.nodes.stopButton.addEventListener("click", () => stopPlayback(state));
    state.nodes.volume.addEventListener("input", (event) => applyVolume(state, Number(event.target.value) / 100));
    state.nodes.preset.addEventListener("change", () => {
      state.scheduler = new BirdRadioScheduler({
        seed: manifest.seed ?? 1,
        preset: state.nodes.preset.value,
        timeMode: state.nodes.timeMode.value,
        clipLibrary: state.clipLibrary,
      });
      if (state.playing) {
        state.pendingEvents = [];
        state.history = [];
        state.queueCursorSec = 0;
        updateAmbientBed(state);
      }
      updateStatus(state, state.playing ? "playing" : "idle", `${state.nodes.preset.value} preset selected.`);
    });
    state.nodes.timeMode.addEventListener("change", () => {
      state.scheduler = new BirdRadioScheduler({
        seed: manifest.seed ?? 1,
        preset: state.nodes.preset.value,
        timeMode: state.nodes.timeMode.value,
        clipLibrary: state.clipLibrary,
      });
      if (state.playing) {
        state.pendingEvents = [];
        state.history = [];
        state.queueCursorSec = 0;
        updateAmbientBed(state);
      }
      updateStatus(state, state.playing ? "playing" : "idle", `${state.nodes.timeMode.value.replace(/_/g, " ")} mode selected.`);
    });

    global.document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        setStatusForLifecycle(state, state.playing ? "recovering" : "idle", "Hidden. Scheduler will recover when the tab returns.");
      } else if (state.playing) {
        setStatusForLifecycle(state, "playing", "Back in view. Scheduler is catching up.");
      }
    });
    global.addEventListener("pagehide", () => setStatusForLifecycle(state, "recovering", "Page is going away. Playback will recover on return."));
    global.addEventListener("freeze", () => setStatusForLifecycle(state, "recovering", "Page frozen by the browser."));
    global.addEventListener("resume", () => {
      if (state.playing) {
        scheduleBatch(state);
        setStatusForLifecycle(state, "playing", "Session resumed.");
      }
    });
    global.addEventListener("offline", () => setStatusForLifecycle(state, "recovering", "Offline. Local scheduler remains ready."));
    global.addEventListener("online", () => {
      if (state.playing) setStatusForLifecycle(state, "playing", "Online again.");
    });

    if (document.wasDiscarded) {
      updateStatus(state, "recovering", "Tab was discarded. Ready to recover on Start.");
    }

    return state;
  }

  global.BirdRadioScheduler = BirdRadioScheduler;
  global.BirdRadioManifest = global.BirdRadioManifest || buildManifestSource();
  global.BirdRadioApp = {
    initialize,
    buildManifestSource,
    createPlayerState,
    manifestToClipLibrary,
    renderApp,
    ambientGainValue,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports.BirdRadioScheduler = BirdRadioScheduler;
    module.exports.BirdRadioApp = global.BirdRadioApp;
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.getElementById("app");
      if (root) {
        initialize(root);
      }
    });
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
