"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

type SupportedCountry =
  | "AR" | "BO" | "BR" | "CL" | "CO" | "EC" | "GY" | "PY" | "PE" | "SR" | "UY" | "VE"
  | "ES" | "PT";

interface CountryDef {
  code: SupportedCountry;
  flag: string;
  callingCode: string;
  placeholder: string;
  hint: string;
}

const COUNTRIES: CountryDef[] = [
  { code: "AR", flag: "🇦🇷", callingCode: "+54",  placeholder: "11 2345 6789",   hint: "Sin 0 y sin 15. Ej: 11 2345 6789" },
  { code: "BO", flag: "🇧🇴", callingCode: "+591", placeholder: "7 123 4567",     hint: "Ej: 7 123 4567" },
  { code: "BR", flag: "🇧🇷", callingCode: "+55",  placeholder: "11 9 1234 5678", hint: "DDD + 9 + número. Ej: 11 9 1234 5678" },
  { code: "CL", flag: "🇨🇱", callingCode: "+56",  placeholder: "9 1234 5678",    hint: "Sin 0. Ej: 9 1234 5678" },
  { code: "CO", flag: "🇨🇴", callingCode: "+57",  placeholder: "310 123 4567",   hint: "Ej: 310 123 4567" },
  { code: "EC", flag: "🇪🇨", callingCode: "+593", placeholder: "99 123 4567",    hint: "Ej: 99 123 4567" },
  { code: "GY", flag: "🇬🇾", callingCode: "+592", placeholder: "600 1234",       hint: "Ej: 600 1234" },
  { code: "PY", flag: "🇵🇾", callingCode: "+595", placeholder: "981 123 456",    hint: "Sin 0. Ej: 981 123 456" },
  { code: "PE", flag: "🇵🇪", callingCode: "+51",  placeholder: "912 345 678",    hint: "Sin 0. Ej: 912 345 678" },
  { code: "SR", flag: "🇸🇷", callingCode: "+597", placeholder: "7 123 456",      hint: "Ej: 7 123 456" },
  { code: "UY", flag: "🇺🇾", callingCode: "+598", placeholder: "91 234 567",     hint: "Sin 0. Ej: 91 234 567" },
  { code: "VE", flag: "🇻🇪", callingCode: "+58",  placeholder: "412 123 4567",   hint: "Sin 0. Ej: 412 123 4567" },
  { code: "ES", flag: "🇪🇸", callingCode: "+34",  placeholder: "612 345 678",    hint: "Ej: 612 345 678" },
  { code: "PT", flag: "🇵🇹", callingCode: "+351", placeholder: "912 345 678",    hint: "Ej: 912 345 678" },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

function toDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildE164(country: SupportedCountry, nationalDigits: string): string {
  const def = BY_CODE.get(country)!;
  const raw = `${def.callingCode}${nationalDigits}`;
  const parsed = parsePhoneNumberFromString(raw, country as CountryCode);
  return parsed?.isValid() ? parsed.number : raw;
}

function isValidPhone(country: SupportedCountry, nationalDigits: string): boolean {
  if (!nationalDigits) return false;
  const def = BY_CODE.get(country)!;
  const raw = `${def.callingCode}${nationalDigits}`;
  const parsed = parsePhoneNumberFromString(raw, country as CountryCode);
  return parsed?.isValid() ?? false;
}

function detectFromE164(e164: string): { country: SupportedCountry; national: string } | null {
  if (!e164?.startsWith("+")) return null;
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed?.isValid()) return null;
  const match = COUNTRIES.find((c) => c.code === (parsed.country as SupportedCountry));
  if (!match) return null;
  return { country: match.code, national: toDigits(parsed.nationalNumber) };
}

export function PhoneInputE164({
  value,
  onChange,
  defaultCountry = "AR",
  disabled,
}: {
  value: string;
  onChange: (nextE164: string) => void;
  defaultCountry?: SupportedCountry;
  disabled?: boolean;
}) {
  const [country, setCountry] = useState<SupportedCountry>(defaultCountry);
  const [national, setNational] = useState("");
  const [touched, setTouched] = useState(false);

  // Track whether the last value change was triggered by us to avoid feedback loops
  const lastEmitted = useRef<string>("");

  const def = useMemo(() => BY_CODE.get(country)!, [country]);
  const isValid = useMemo(() => isValidPhone(country, national), [country, national]);
  const showValidation = touched && national.length > 0;

  // Sync from external value only when it's an incoming edit (not our own emission)
  useEffect(() => {
    if (!value || value === lastEmitted.current) return;
    const detected = detectFromE164(value);
    if (detected) {
      setCountry(detected.country);
      setNational(detected.national);
    }
    // If we can't parse it, ignore — don't corrupt national with raw digits that include the calling code
  }, [value]);

  function emit(nextCountry: SupportedCountry, nextNational: string) {
    const e164 = buildE164(nextCountry, nextNational);
    lastEmitted.current = e164;
    onChange(e164);
  }

  function handleCountryChange(next: SupportedCountry) {
    setCountry(next);
    emit(next, national);
  }

  function handleNationalChange(raw: string) {
    const digits = toDigits(raw);
    setNational(digits);
    emit(country, digits);
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select value={country} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[130px] shrink-0 bg-muted/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.callingCode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Input
            disabled={disabled}
            value={national}
            onChange={(e) => handleNationalChange(e.target.value)}
            onBlur={() => setTouched(true)}
            inputMode="numeric"
            autoComplete="tel"
            className={`pr-9 ${
              showValidation
                ? isValid
                  ? "border-green-500 focus-visible:ring-green-500"
                  : "border-red-400 focus-visible:ring-red-400"
                : ""
            }`}
            placeholder={def.placeholder}
          />
          {showValidation && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {showValidation && !isValid && (
        <p className="text-xs text-muted-foreground">{def.hint}</p>
      )}
    </div>
  );
}
