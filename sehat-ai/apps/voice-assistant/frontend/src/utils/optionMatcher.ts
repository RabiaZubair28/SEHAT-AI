
export interface MatchableOption {
  label?: unknown;
  value: unknown;
}

export type OptionMatch<T extends MatchableOption> =
  | {
      status: "matched";
      option: T;
      confidence: number;
    }
  | {
      status: "ambiguous" | "unmatched";
      confidence: number;
    };

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[يى]/g, "ی")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function phonetic(value: string): string {
  return normalize(value)
    .replace(
      /\b(?:division|district|taluka|tehsil|town|union council|uc)\b/g,
      " "
    )
    .replace(/kh|gh/g, "x")
    .replace(/ph/g, "f")
    .replace(/sh/g, "s")
    .replace(/ch/g, "c")
    .replace(/qu|q/g, "k")
    .replace(/ck|kk/g, "k")
    .replace(/oo|ou|u/g, "o")
    .replace(/ee|ea|i|y/g, "e")
    .replace(/aa|a/g, "a")
    .replace(/([bcdfghjklmnpqrstvwxyz])\1+/g, "$1")
    .replace(/[\s-]+/g, "")
    .replace(/h(?=[^aeiou]|$)/g, "")
    .trim();
}

function editDistance(
  left: string,
  right: string
): number {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index
  );

  const current = new Array<number>(
    right.length + 1
  );

  for (let i = 1; i <= left.length; i++) {
    current[0] = i;

    for (let j = 1; j <= right.length; j++) {
      const cost =
        left[i - 1] === right[j - 1] ? 0 : 1;

      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j < previous.length; j++) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function similarity(
  left: string,
  right: string
): number {
  if (!left || !right) return 0;
  if (left === right) return 1;

  return Math.max(
    0,
    1 -
      editDistance(left, right) /
        Math.max(left.length, right.length)
  );
}

function scoreCandidate(
  spoken: string,
  candidate: string
): number {
  const source = normalize(spoken);
  const target = normalize(candidate);

  if (!source || !target) return 0;
  if (source === target) return 1;

  const lexical = similarity(
    source.replace(/\s/g, ""),
    target.replace(/\s/g, "")
  );

  const sourceSound = phonetic(source);
  const targetSound = phonetic(target);

  const sound = similarity(
    sourceSound,
    targetSound
  );

  if (sourceSound === targetSound) {
    return Math.max(0.96, lexical);
  }

  return Math.max(
    lexical * 0.94,
    sound * 0.88 + lexical * 0.12
  );
}

export function matchOption<
  T extends MatchableOption
>(
  spoken: unknown,
  options: T[],
  config: {
    threshold?: number;
    minimumGap?: number;
  } = {}
): OptionMatch<T> {
  const threshold = config.threshold ?? 0.79;
  const minimumGap = config.minimumGap ?? 0.09;
  const input = normalize(spoken);

  if (!input || options.length === 0) {
    return {
      status: "unmatched",
      confidence: 0,
    };
  }

  const ranked = options
    .map((option) => ({
      option,
      score: Math.max(
        scoreCandidate(
          input,
          String(option.label ?? "")
        ),
        scoreCandidate(
          input,
          String(option.value ?? "")
        )
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];

  if (best.score < threshold) {
    return {
      status: "unmatched",
      confidence: best.score,
    };
  }

  if (
    second &&
    best.score - second.score < minimumGap
  ) {
    return {
      status: "ambiguous",
      confidence: best.score,
    };
  }

  return {
    status: "matched",
    option: best.option,
    confidence: best.score,
  };
}
