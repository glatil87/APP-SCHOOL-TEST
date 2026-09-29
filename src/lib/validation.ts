import { DEFAULT_AVATAR, isAvatarId, type AvatarId } from "./avatars";

export type Parsed<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Record<string, string>; values: Record<string, string> };

export type AccountDetails = {
  parentFirstName: string;
  childFirstName: string;
  avatar: AvatarId;
  phone: string | null;
};

export type NewAccount = AccountDetails & { email: string; password: string };

export const MIN_PASSWORD = 8;

function text(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
}

function firstName(value: string, who: string): string | undefined {
  if (!value) return `Please enter ${who} first name.`;
  if (value.length > 40) return "Please keep this under 40 characters.";
}

/** Name, child's name, picture and optional phone. */
export function parseAccountDetails(form: FormData): Parsed<AccountDetails> {
  const values = {
    parent_first_name: text(form, "parent_first_name"),
    child_first_name: text(form, "child_first_name"),
    avatar: text(form, "avatar"),
    phone: text(form, "phone"),
  };
  const fieldErrors: Record<string, string> = {};

  const parentError = firstName(values.parent_first_name, "your");
  if (parentError) fieldErrors.parent_first_name = parentError;
  const childError = firstName(values.child_first_name, "your child’s");
  if (childError) fieldErrors.child_first_name = childError;
  if (values.phone && !/^\+?[\d\s()-]{7,20}$/.test(values.phone)) {
    fieldErrors.phone = "Please enter a phone number using digits only, e.g. 07700 900123.";
  }

  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, values };
  return {
    ok: true,
    data: {
      parentFirstName: values.parent_first_name,
      childFirstName: values.child_first_name,
      avatar: isAvatarId(values.avatar) ? values.avatar : DEFAULT_AVATAR,
      phone: values.phone || null,
    },
  };
}

/** Account details plus email and password, for signing up. */
export function parseNewAccount(form: FormData): Parsed<NewAccount> {
  const details = parseAccountDetails(form);
  const email = text(form, "email").toLowerCase();
  const password = typeof form.get("password") === "string" ? (form.get("password") as string) : "";
  const fieldErrors = details.ok ? {} : { ...details.fieldErrors };
  const values = details.ok ? {} : { ...details.values };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }
  if (password.length < MIN_PASSWORD) {
    fieldErrors.password = `Please choose a password with at least ${MIN_PASSWORD} characters.`;
  }

  if (!details.ok || Object.keys(fieldErrors).length) {
    // Never echo the password back into the form.
    const echo = details.ok ? plainValues(form) : values;
    return { ok: false, fieldErrors, values: { ...echo, email } };
  }
  return { ok: true, data: { ...details.data, email, password } };
}

function plainValues(form: FormData): Record<string, string> {
  return {
    parent_first_name: text(form, "parent_first_name"),
    child_first_name: text(form, "child_first_name"),
    avatar: text(form, "avatar"),
    phone: text(form, "phone"),
  };
}

export function parseSchoolName(form: FormData): string | undefined {
  const name = text(form, "school_name");
  return name && name.length <= 120 ? name : undefined;
}
