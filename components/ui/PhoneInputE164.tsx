"use client";

import { useEffect, useMemo, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SupportedCountry = "AR" | "UY";

const countries: Array<{ code: SupportedCountry; label: string; flag: string; callingCode: string }> = [
  { code: "AR", label: "Argentina", flag: "🇦🇷", callingCode: "+54" },
  { code: "UY", label: "Uruguay", flag: "🇺🇾", callingCode: "+598" },
];

function toDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function computeE164(country: SupportedCountry, nationalDigits: string) {
  const prefix = countries.find((c) => c.code === country)?.callingCode ?? "+";
  const raw = `${prefix}${nationalDigits}`;
  const parsed = parsePhoneNumberFromString(raw);
  if (parsed?.isValid()) return parsed.number;
  return raw; // best-effort (ya empieza con +)
}

export function PhoneInputE164({
  value,
  onChange,
  defaultCountry = "AR",
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (nextE164: string) => void;
  defaultCountry?: SupportedCountry;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [country, setCountry] = useState<SupportedCountry>(defaultCountry);
  const [national, setNational] = useState("");

  const callingCode = useMemo(
    () => countries.find((c) => c.code === country)?.callingCode ?? "+",
    [country],
  );

  useEffect(() => {
    // Si nos pasan E.164 (ej: +54911...), intentamos inferir país y nacional
    const parsed = parsePhoneNumberFromString(value || "");
    if (parsed?.isValid()) {
      const cc = `+${parsed.countryCallingCode}`;
      const match = countries.find((c) => c.callingCode === cc);
      if (match) setCountry(match.code);
      setNational(toDigits(parsed.nationalNumber));
      return;
    }

    // fallback: si empieza con +54 / +598, descomponer; si no, lo tratamos como nacional
    if (value?.startsWith("+54")) {
      setCountry("AR");
      setNational(toDigits(value.slice(3)));
      return;
    }
    if (value?.startsWith("+598")) {
      setCountry("UY");
      setNational(toDigits(value.slice(4)));
      return;
    }
    setNational(toDigits(value || ""));
  }, [value]);

  return (
    <div className="flex gap-2">
      <Select
        value={country}
        onValueChange={(v) => {
          const nextCountry = v as SupportedCountry;
          setCountry(nextCountry);
          onChange(computeE164(nextCountry, national));
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px] bg-muted/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.callingCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {callingCode}
        </div>
        <Input
          disabled={disabled}
          value={national}
          onChange={(e) => {
            const nextNational = toDigits(e.target.value);
            setNational(nextNational);
            onChange(computeE164(country, nextNational));
          }}
          inputMode="numeric"
          autoComplete="tel"
          className="pl-14"
          placeholder={placeholder ?? "Ej: 11 2345 6789"}
        />
      </div>
    </div>
  );
}

