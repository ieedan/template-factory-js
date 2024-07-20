<div align="center">
  <img src="https://github.com/user-attachments/assets/5b77a29a-7a9f-4f45-bb9a-1a2810963bcd">
</div>

# template-factory-js

```bash
npm install template-factory
```

An unreasonably easy way to create distributable project templates.

## What is this?

**template-factory** is a package you install to help you scaffold a template application.

It provides a consistent way to structure your CLI application as well as helpful features such as
file exclusions or replacements.

## Getting Started

This will take you though setting up a basic SvelteKit template. Don't worry you won't need to know
anything about SvelteKit to complete the tutorial.

The complete code for this guide is under
[/examples/javascript](https://github.com/ieedan/template-factory-js/tree/main/examples/javascript).

The easiest way to get started is to use a template.
[@iedan/create](https://github.com/ieedan/create) has a template for this.

```bash
npx @iedan/create -t template-factory
```

Take the path for JavaScript and you'll end up with a file structure like this:

```
my-template-project
├── src
│   └── index.js
├── templates
│   └── notes
│       ├── template-files
│       └── NOTES.md
├── ...
├── bin.mjs
└── package.json
```

Delete the notes directory and lets create the SvelteKit project instead:

```bash
# under ./templates
npm create svelte@latest sveltekit
```

Next lets write the program in `index.js` (If you are using TypeScript then `index.ts`).

```js
#!/usr/bin/env node
import { create } from 'template-factory';
import * as util from 'template-factory/util';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        // we have to pass it this way so that it resolves correctly in production
        // we put '../' because it is relative to the index.js file
        path: util.relative('../templates/sveltekit', import.meta.url),
        flag: 'sveltekit',
      },
    ],
  });
};

main();
```

Now run

```bash
npm run start
```

Now you should see the CLI

```bash
┌   guide  v1.0.0
│
◆  Where should we create the project?
│   (hit Enter to use current directory)
└
```

The user can now enter what they want to call the project and the project will be created for them.

The user can also run

```bash
# passes `my-project` as the name of the project
npm run start my-project
```

This skips `Where should we create the project?` prompt and creates the project with the specified
name.

But right now this really doesn't do anything so lets add some features!

Lets add a feature for `@threlte`.

To do this we will need to add a [prompt](#prompts)!

```js
#!/usr/bin/env node
// we add execa here to make command execution easy
import { execa } from 'execa';
import { create } from 'template-factory';
import * as util from 'template-factory/util';

const main = async () => {
  await create({
    appName: 'guide',
    version: '1.0.0',
    templates: [
      {
        name: 'SvelteKit',
        // we have to pass it this way so that it resolves correctly in production
        // we put '../' because it is relative to the index.js file
        path: util.relative('../templates/sveltekit', import.meta.url),
        flag: 'sveltekit',
        prompts: [
          {
            kind: 'confirm',
            message: 'Would you like to install @threlte?',
            yes: {
              run: async ({ dir }) => {
                await execa({ cwd: dir })`npm install three @threlte/core`;
              },
              startMessage: 'Installing @threlte',
              endMessage: 'Installed @threlte',
            },
          },
        ],
      },
    ],
  });
};

main();
```

Now when you run the program again it should look like this:

```bash
┌   guide  v1.0.0
│
◇  Created test
│
◆  Would you like to install @threlte?
│  ○ Yes / ● No
└
```

To see more about prompts check our [API Reference](#api-reference)

## Examples

We provide some [basic examples](https://github.com/ieedan/template-factory-js/tree/main/examples)
with the project to get you started but if you want to see full scale examples you should check out
the [Community Examples](#community-examples)

## Community Examples

Here are some examples of the power of **template-factory-js**. If you would like to contribute one
let us know 😉!

- [@iedan/create](https://github.com/ieedan/create) Personal project templates for
  [@ieedan](https://github.com/ieedan)

## API Reference

Any documentation for this library you'll find here! If anythings missing or unclear feel free to
open an [issue](https://github.com/ieedan/template-factory-js/issues/new).

### Templates

When creating a template you must provide a name, flag and either the path or repo property.

```ts
export type Template<State = unknown> = {
  // Name of the template
  name: string;
  // Path to the template from the root of your project
  path?: string;
  // Repository to clone as a template
  repo?: string;
  // The value for the `-t` / `--template` used to select this template
  flag: string;
  // Files/Directories that should be excluded from being copied
  excludeFiles?: string[];
  // Specify prompts that are used to select options or features
  prompts?: Prompt<State>[];
  // Files allow you to make modifications to files in the project in a more ergonomic way
  files?: File<State>[];
  // Runs after files have been copied but before features have been selected
  copyCompleted?: (opts: TemplateOptions<State>) => Promise<void>;
  // Runs after the outro allowing you to show next steps or run final cleanup code.
  completed?: (opts: TemplateOptions<State>) => Promise<void>;
  // Initial state for the template
  state?: State;
};
```

### Multiple templates

To have multiple templates in a single project just add them to the array! **template-factory-js**
will prompt the user and ask them what template they want to use once you have more than one
template.

### Prompts

Prompts are a huge part of what makes **template-factory** useful. It makes defining features and
options to add to your templates extremely easy.

#### Prompt Kinds

There are currently three kinds of prompts:

- **confirm** - yes or no
- **select** - select one of the provided options
- **multiselect** - select zero, one, or multiple of the provided options
- **text** - get a validated text input from the user
- **password** - get a validated text input from the user while also hiding it

When creating a prompt you add it to the list of prompts for your template:

```ts
await create({
  //...
  templates: [
    {
      //...
      prompts: [
        // add your prompt here
      ],
    },
  ],
});
```

You must specify the kind of prompt and a message for the prompt to display (should be a question).

```js
prompts: [
  {
    kind: 'confirm',
    message: 'Would you like to install lodash?',
  },
],
```

Once you have done that you need to specify the code that will run when an option is selected.

For **confirm** prompts that should look like this:

```js
{
  kind: 'confirm',
  message: 'Would you like to install lodash?',
  // set initial value for the prompt
  initialValue: false,
  // what to do on `yes`
  yes: {
    // run your code here
    run: async ({ dir }) => {
      // install lodash
    },
    // shown while awaiting `run`
    startMessage: 'Installing lodash',
    // shown once `run` is done
    endMessage: 'Installed lodash',
  },
  // what to do on `no`
  no: {
    // structure is the same as yes
  },
}
```

For **select** and **multiselect** prompts your code should look like this:

```js
{
  kind: 'multiselect', // or multiselect
  message: 'What features should we include?',
  // set initial value for the prompt
  initialValue: ["prettier"],
  options: [
    {
      name: "prettier",
      // what to do when selected
      select: {
        run: async ({ dir }) => {
          // install prettier
        },
        // shown while awaiting `run`
        startMessage: 'Installing prettier',
        // shown once `run` is done
        endMessage: 'Installed prettier',
      }
    },
    {
      name: "eslint",
      // what to do when selected
      select: {
        run: async ({ dir }) => {
          // install eslint
        },
        // shown while awaiting `run`
        startMessage: 'Installing eslint',
        // shown once `run` is done
        endMessage: 'Installed eslint',
      }
    }
  ]
}
```

**text** and **password** prompts will look like this:

```js
{
  kind: 'text',
  message: 'Enter your Database URL',
  // what to do on `yes`
  validate: (value) => {
    if (value == "") {
      return "Please enter a Database URL";
    }
  },
  result: {
    run: async (result) => {
      // add to .env
    },
    startMessage: "Setting up your Database URL",
    endMessage: "Set up your Database URL",
  }
}
```

#### Recursive Prompts

Recursive prompts allow you to run prompts on prompts. This is useful when you would like to create
prompts that will only be shown to the user if a specific selection is made.

To do this you return more prompts from the `run` function of the parent prompt.

The result looks something like this:

```js
prompts: [
  {
    kind: 'multiselect',
    message: 'What features should be included?',
    options: [
      {
        name: 'Threlte',
        select: {
          run: async ({ dir }) => {
            // install threlte

            // return an array of prompts to run
            return [
              {
                message: 'Do you want to install any other @threlte packages?',
                kind: 'multiselect',
                options: [
                  '@threlte/extras',
                  '@threlte/gltf',
                  '@threlte/rapier',
                  '@threlte/theatre',
                  '@threlte/xr',
                  '@threlte/flex',
                ].map((pack) => ({
                  name: pack,
                  select: {
                    run: async ({ dir }) => {
                      // install package
                    },
                    startMessage: `Installing ${pack}`,
                    endMessage: `Installed ${pack}`,
                  },
                })),
              },
            ];
          },
          startMessage: 'Installing @threlte/core, three, and @types/three',
          endMessage: 'Installed Threlte',
        },
      },
    ],
  },
],
```

### Copy Completed

**template-factory** exposes a callback on every template called `copyCompleted` this is called with
the working directory and project name once the template files have been copied over but before any
prompts have been run.

This is a good place to generate files or do other work that is dependent on the directories being
there but not optional to the user.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      copyCompleted: async ({ dir, projectName }) => {
        const file = path.join(dir, 'README.md');

        const content = `# ${projectName}`;

        await fs.writeFile(file, content);
      },
    },
  ],
});
```

### Manipulate Files

Sometimes it is nice to be able to easily rename a file or modify its contents. **template-factory**
provides an API for doing this through the `files` property on the template object.

In the `content` function you will be provided with the name of the file and the content of the
file. Certain file types such as JSON come pre-parsed for you. You can then return the new content
and new name of the file once you've made your changes.

Here is an example of us changing the `bin` property of our `package.json` file based on the
template state.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      files: [
        {
          // path to the file you want to make the replacement
          path: 'package.json',
          type: 'json',
          content: ({ name, content }, { state }) => {
            content.bin = state.binPath;

            return content;
          },
        },
      ],
    },
  ],
});
```

### Prevent files from being copied

Sometimes there are files in your template that you don't want to copy to the users project for
whatever reason.

One way to do this is to include them in the `.gitignore` file. **template-factory** respects the
`.gitignore` by default preventing ignored files from being copied.

However sometimes you may want those files to be committed.

In that case you can provide the `excludeFiles` property on the template.

```js
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...,
      excludeFiles: ['DONOTCOPY.js'],
    },
  ],
});
```

### Personalization

Sometimes you may want to customize your app so that it gives the look you want. While
**template-factory** doesn't currently provide many ways to do this in the program it does provide
customization for the `intro` and `outro` messages.

```js
await create({
  //...
  templates: [
    //...
  ],
  customization: {
    intro: async ({ appName, version }) => {
      const name = color.bgHex('#0000ff').white(` ${appName} `);
      const ver = color.gray(` v${version} `);
      return name + ver;
    },
    outro: async ({}) => {
      return color.green('All done!');
    },
  },
});
```

### Handling Errors

Handling errors is somewhat difficult thanks to the way they work in JavaScript as well as
commanders overrides.

Because of this in any of the functions defined by you such as `copyCompleted` or `run` functions we
pass an `error` function to allow you to write to the error console and stop program execution.

That looks something like this:

```ts
await create({
  //...
  templates: [
    {
      name: 'Notes',
      //...
      // add error function
      copyCompleted: async ({ dir, projectName, error }) => {
        const file = path.join(dir, 'README.md');

        // handle error on code that can error
        await fs.readFile(file, content).catch((err) => error(err));
      },
    },
  ],
});
```

### Util

Util contains necessary utilities to use the package.

```ts
import * as util from 'template-factory/util';
```

#### relative

This function helps make sure your paths to your templates or other files that should be located
based on the directory of your project are resolved correctly.

```ts
await create({
  //..
  templates: [
    {
      name: 'SvelteKit',
      // resolves to the absolute path for templates/sveltekit
      path: util.relative('templates/sveltekit', import.meta.url),
      flag: 'sveltekit',
    },
  ],
});
```

## Plugins

As more things are built with **template-factory** we find times that we repeat ourselves. When
those instances of code would be beneficial to users of the library we include them as plugins.

Plugins are separated by language so plugins for creating JavaScript/TypeScript templates will be
under `template-factory/plugins/js`.

### JS

#### util

Contains some utility functions that are useful for working with JavaScript templates.

##### addDependencies/removeDependencies

These functions make it easy to add and remove dependencies without installing and creating the
`node_modules` folder. This saves a lot of time compared to waiting for things to install.

###### Example

```ts
import { addDependencies, removeDependencies } from 'template-factory/plugins/js/util';

addDependencies('dev', { pm: 'npm', dir: '.' }, 'prettier', 'eslint');
removeDependencies(dir, 'prettier', 'eslint');
```

#### prompts

Contains common prompts for creating prompts for JavaScript templates.

##### installDependencies

Prompts the user to ask them if they would like to install dependencies. When the
`choosePackageManager` option is set to true, once the user says yes to install dependencies it will
ask them what package manager they would like to use. Once selected it will install run the install
command for the selected package manager.

It returns a prompt and should be injected in the `prompts` property of a template.

```ts
import { installDependencies } from 'template-factory/plugins/js/prompts';

await create({
  //...
  templates: [
    {
      //...
      prompts: [installDependencies({ pm: 'npm' })],
    },
  ],
});
```
