import test from "node:test";
import assert from "node:assert/strict";
import messages from "../src/i18n/messages.json" with { type: "json" };
import errors from "../src/generated/errors.json" with { type: "json" };
import { translate } from "../src/i18n/translate.js";

test("interface translations cover matching catalogs and retain interpolation variables", () => {
  assert.deepEqual(
    Object.keys(messages["pt-BR"]).sort(),
    Object.keys(messages.es).sort(),
  );
  const placeholders = (value) =>
    [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [source, value] of Object.entries(messages["pt-BR"])) {
    assert(value.trim());
    assert.deepEqual(placeholders(value), placeholders(source), source);
    assert.deepEqual(placeholders(messages.es[source]), placeholders(source), source);
  }
  assert.equal(translate("Save changes", "pt-BR"), "Salvar alterações");
  assert.equal(translate("Save changes", "es"), "Guardar cambios");
  assert.equal(translate("Save changes", "en"), "Save changes");
  assert.equal(translate("in_development", "en"), "In development");
});

test("language changes translate previous notifications and backend errors without losing user values", () => {
  assert.equal(translate("Alterações salvas.", "es"), "Cambios guardados.");
  assert.equal(translate("Conectado como Alice", "en"), "Connected as Alice");
  assert.equal(translate("Downloaded default.", "pt-BR"), "default baixado.");
  assert.equal(
    translate('Nothing matched "<script>".', "es"),
    'No hay resultados para "<script>".',
  );
  assert.equal(translate("Save changes", "unknown"), "Save changes");
  assert.equal(
    translate(" Content authored by the administrator. ", "pt-BR"),
    " Content authored by the administrator. ",
  );
  assert.equal(
    translate(errors.en.VALIDATION_ERROR, "pt-BR"),
    errors["pt-BR"].VALIDATION_ERROR,
  );
  assert.equal(translate(errors.es.VALIDATION_ERROR, "en"), errors.en.VALIDATION_ERROR);
});
