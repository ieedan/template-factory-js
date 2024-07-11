import { program } from 'commander';
import { intro, spinner, text, isCancel, cancel, confirm, select, outro, multiselect } from '@clack/prompts';
import path from 'node:path';
import fs from 'fs-extra';
import ignore from 'ignore';

const create = async ({ appName, respectGitIgnore, templates }) => {
  program.name(appName).argument("[project-name]", "Name of the project");
  program.parse();
  intro(appName);
  const loading = spinner();
  let projectName = program.args[0];
  let dir = ".";
  if (projectName) {
    dir = projectName;
  } else {
    const dirResult = await text({
      defaultValue: ".",
      message: `Where should we create the project?`,
      placeholder: " (hit Enter to use current directory)"
    });
    if (isCancel(dirResult)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    if (dirResult == ".") {
      projectName = path.basename(process.cwd());
    } else {
      projectName = path.basename(dirResult);
    }
  }
  if (dir != "." && !await fs.exists(dir)) {
    await fs.mkdir(dir);
  }
  const empty = (await fs.readdir(dir)).length == 0;
  if (!empty) {
    const cont = await confirm({ message: "Directory is not empty continue?" });
    if (!cont) {
      cancel("Cancelled.");
      process.exit(0);
    }
  }
  let template;
  if (templates.length == 1) {
    template = templates[0];
  } else {
    const templateSelection = await select({
      message: "What template should we use?",
      options: templates.map((template2, index) => ({
        label: template2.name,
        value: index
      }))
    });
    if (isCancel(templateSelection)) {
      cancel("Cancelled.");
      process.exit(0);
    }
    template = templates[templateSelection];
  }
  const ig = ignore();
  if (template.excludeFiles) {
    ig.add(template.excludeFiles);
  }
  if (respectGitIgnore == void 0 || respectGitIgnore) {
    const ignorePath = path.join(template.path, ".gitignore");
    if (await fs.exists(ignorePath)) {
      ig.add((await fs.readFile(ignorePath)).toString());
    }
  }
  loading.start(`Creating ${projectName}`);
  await fs.copy(template.path, dir, {
    filter: (file) => {
      const filePath = path.normalize(file).toString().replaceAll(path.normalize(template.path + "\\"), "");
      return !ig.ignores(filePath);
    }
  });
  loading.stop(`Created ${projectName}`);
  if (template.templateFiles) {
    for (const file of template.templateFiles) {
      const filePath = path.join(dir, file.path);
      const content = (await fs.readFile(filePath)).toString();
      let newContent = "";
      file.replacements.forEach((replacement) => {
        newContent = content.replace(
          replacement.match,
          replacement.replace({ projectName, dir })
        );
      });
      await fs.writeFile(filePath, newContent);
    }
  }
  if (template.copyCompleted) {
    await template.copyCompleted({ projectName, dir });
  }
  if (template.features) {
    await enableFeatures(loading, template.features, { projectName, dir });
  }
  outro("Your project is ready!");
};
const enableFeatures = async (loading, features, opts, parent = void 0) => {
  const featureSelection = await multiselect({
    message: parent ? `What features should be included with ${parent}?` : "What features should be included?",
    required: false,
    options: features.map((feature, index) => ({
      label: feature.name,
      value: index
    }))
  });
  if (isCancel(featureSelection)) {
    cancel("Cancelled.");
    process.exit(0);
  }
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    if (!featureSelection.includes(i))
      continue;
    loading.start(feature.enable.startMessage ?? `Setting up ${feature.name}`);
    await feature.enable.run(opts);
    loading.stop(feature.enable.endMessage ?? `Finished setup for ${feature.name}`);
    if (feature.features) {
      await enableFeatures(loading, feature.features, opts, feature.name);
    }
  }
};

export { create };
