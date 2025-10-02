import { describe, test, expect } from 'vitest'
import { getComponentMeta } from '../src/parser'
import { propsToJsonSchema } from '../src/utils/schema'

describe('Enum Support', () => {
  test('should handle enum types correctly', async () => {
    const meta = getComponentMeta('playground/components/EnumTestComponent.vue')
    const jsonSchema = propsToJsonSchema(meta.props)
    
    expect(jsonSchema).toBeDefined()
    expect(jsonSchema.type).toBe('object')
    expect(jsonSchema.properties).toBeDefined()

    // Test color enum
    expect(jsonSchema.properties?.color).toEqual({
      type: 'string',
      enum: ['error', 'primary', 'secondary', 'success', 'info', 'warning', 'neutral'],
      description: 'The color of the component',
      default: 'primary'
    })

    // Test size enum
    expect(jsonSchema.properties?.size).toEqual({
      type: 'string',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'The size of the component',
      default: 'md'
    })

    // Test variant enum
    expect(jsonSchema.properties?.variant).toEqual({
      type: 'string',
      enum: ['solid', 'outline', 'soft', 'subtle', 'ghost', 'link'],
      description: 'The variant of the component',
      default: 'solid'
    })

    // Test boolean (should not have enum)
    expect(jsonSchema.properties?.disabled).toEqual({
      type: 'boolean',
      description: 'Whether the component is disabled'
    })

    // Test string (should not have enum)
    expect(jsonSchema.properties?.label).toEqual({
      type: 'string',
      description: 'The label text'
    })
  })

  test('should handle the provided enum data correctly', () => {
    // Test with the actual data structure from the user's request
    const mockProps = [
      {
        name: 'color',
        global: false,
        description: '',
        tags: [
          {
            name: 'defaultValue',
            text: "'primary'"
          }
        ],
        required: false,
        type: '"error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral" | undefined',
        schema: {
          kind: 'enum',
          type: '"error" | "primary" | "secondary" | "success" | "info" | "warning" | "neutral" | undefined',
          schema: {
            '0': 'undefined',
            '1': '"error"',
            '2': '"primary"',
            '3': '"secondary"',
            '4': '"success"',
            '5': '"info"',
            '6': '"warning"',
            '7': '"neutral"'
          }
        }
      },
      {
        name: 'size',
        global: false,
        description: '',
        tags: [
          {
            name: 'defaultValue',
            text: "'md'"
          }
        ],
        required: false,
        type: '"xs" | "sm" | "md" | "lg" | "xl" | undefined',
        schema: {
          kind: 'enum',
          type: '"xs" | "sm" | "md" | "lg" | "xl" | undefined',
          schema: {
            '0': 'undefined',
            '1': '"xs"',
            '2': '"sm"',
            '3': '"md"',
            '4': '"lg"',
            '5': '"xl"'
          }
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(mockProps as any)
    
    expect(jsonSchema.properties?.color).toEqual({
      type: 'string',
      enum: ['error', 'primary', 'secondary', 'success', 'info', 'warning', 'neutral'],
      default: 'primary'
    })

    expect(jsonSchema.properties?.size).toEqual({
      type: 'string',
      enum: ['xs', 'sm', 'md', 'lg', 'xl'],
      default: 'md'
    })
  })

  test('should handle boolean enum types correctly', () => {
    const booleanEnumData = [
      {
        "name": "label",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "color",
        "global": false,
        "description": "",
        "tags": [
          {
            "name": "defaultValue",
            "text": "'primary'"
          }
        ],
        "required": false,
        "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"error\"",
            "2": "\"primary\"",
            "3": "\"secondary\"",
            "4": "\"success\"",
            "5": "\"info\"",
            "6": "\"warning\"",
            "7": "\"neutral\""
          }
        }
      },
      {
        "name": "activeColor",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"error\"",
            "2": "\"primary\"",
            "3": "\"secondary\"",
            "4": "\"success\"",
            "5": "\"info\"",
            "6": "\"warning\"",
            "7": "\"neutral\""
          }
        }
      },
      {
        "name": "variant",
        "global": false,
        "description": "",
        "tags": [
          {
            "name": "defaultValue",
            "text": "'solid'"
          }
        ],
        "required": false,
        "type": "\"solid\" | \"outline\" | \"soft\" | \"subtle\" | \"ghost\" | \"link\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"solid\" | \"outline\" | \"soft\" | \"subtle\" | \"ghost\" | \"link\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"solid\"",
            "2": "\"outline\"",
            "3": "\"soft\"",
            "4": "\"subtle\"",
            "5": "\"ghost\"",
            "6": "\"link\""
          }
        }
      },
      {
        "name": "activeVariant",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "\"solid\" | \"outline\" | \"soft\" | \"subtle\" | \"ghost\" | \"link\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"solid\" | \"outline\" | \"soft\" | \"subtle\" | \"ghost\" | \"link\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"solid\"",
            "2": "\"outline\"",
            "3": "\"soft\"",
            "4": "\"subtle\"",
            "5": "\"ghost\"",
            "6": "\"link\""
          }
        }
      },
      {
        "name": "size",
        "global": false,
        "description": "",
        "tags": [
          {
            "name": "defaultValue",
            "text": "'md'"
          }
        ],
        "required": false,
        "type": "\"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"xs\"",
            "2": "\"sm\"",
            "3": "\"md\"",
            "4": "\"lg\"",
            "5": "\"xl\""
          }
        }
      },
      {
        "name": "square",
        "global": false,
        "description": "Render the button with equal padding on all sides.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "block",
        "global": false,
        "description": "Render the button full width.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "loadingAuto",
        "global": false,
        "description": "Set loading state automatically based on the `@click` promise state",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "onClick",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "((event: MouseEvent) => void | Promise<void>) | ((event: MouseEvent) => void | Promise<void>)[] | undefined",
        "schema": {
          "kind": "enum",
          "type": "((event: MouseEvent) => void | Promise<void>) | ((event: MouseEvent) => void | Promise<void>)[] | undefined",
          "schema": {
            "0": "undefined",
            "1": {
              "kind": "event",
              "type": "(event: MouseEvent): void | Promise<void>",
              "schema": []
            },
            "2": {
              "kind": "array",
              "type": "((event: MouseEvent) => void | Promise<void>)[]",
              "schema": [
                {
                  "kind": "event",
                  "type": "(event: MouseEvent): void | Promise<void>",
                  "schema": []
                }
              ]
            }
          }
        }
      },
      {
        "name": "ui",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "{ base?: ClassNameValue; label?: ClassNameValue; leadingIcon?: ClassNameValue; leadingAvatar?: ClassNameValue; leadingAvatarSize?: ClassNameValue; trailingIcon?: ClassNameValue; } | undefined",
        "schema": {
          "kind": "enum",
          "type": "{ base?: ClassNameValue; label?: ClassNameValue; leadingIcon?: ClassNameValue; leadingAvatar?: ClassNameValue; leadingAvatarSize?: ClassNameValue; trailingIcon?: ClassNameValue; } | undefined",
          "schema": {
            "0": "undefined",
            "1": "{ base?: ClassNameValue; label?: ClassNameValue; leadingIcon?: ClassNameValue; leadingAvatar?: ClassNameValue; leadingAvatarSize?: ClassNameValue; trailingIcon?: ClassNameValue; }"
          }
        }
      },
      {
        "name": "icon",
        "global": false,
        "description": "Display an icon based on the `leading` and `trailing` props.",
        "tags": [
          {
            "name": "IconifyIcon"
          }
        ],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "avatar",
        "global": false,
        "description": "Display an avatar on the left side.",
        "tags": [],
        "required": false,
        "type": "AvatarProps | undefined",
        "schema": {
          "kind": "enum",
          "type": "AvatarProps | undefined",
          "schema": {
            "0": "undefined",
            "1": {
              "kind": "object",
              "type": "AvatarProps",
              "schema": {
                "as": {
                  "name": "as",
                  "global": false,
                  "description": "The element or component this component should render as.",
                  "tags": [
                    {
                      "name": "defaultValue",
                      "text": "'span'"
                    }
                  ],
                  "required": false,
                  "type": "any",
                  "schema": "any"
                },
                "src": {
                  "name": "src",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "string | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "string"
                    }
                  }
                },
                "alt": {
                  "name": "alt",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": "string | undefined"
                },
                "icon": {
                  "name": "icon",
                  "global": false,
                  "description": "",
                  "tags": [
                    {
                      "name": "IconifyIcon"
                    }
                  ],
                  "required": false,
                  "type": "string | undefined",
                  "schema": "string | undefined"
                },
                "text": {
                  "name": "text",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": "string | undefined"
                },
                "size": {
                  "name": "size",
                  "global": false,
                  "description": "",
                  "tags": [
                    {
                      "name": "defaultValue",
                      "text": "'md'"
                    }
                  ],
                  "required": false,
                  "type": "\"3xs\" | \"2xs\" | \"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "\"3xs\" | \"2xs\" | \"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "\"3xs\"",
                      "2": "\"2xs\"",
                      "3": "\"xs\"",
                      "4": "\"sm\"",
                      "5": "\"md\"",
                      "6": "\"lg\"",
                      "7": "\"xl\"",
                      "8": "\"2xl\"",
                      "9": "\"3xl\""
                    }
                  }
                },
                "chip": {
                  "name": "chip",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "boolean | ChipProps | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "boolean | ChipProps | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "false",
                      "2": "true",
                      "3": {
                        "kind": "object",
                        "type": "ChipProps",
                        "schema": {
                          "as": {
                            "name": "as",
                            "global": false,
                            "description": "The element or component this component should render as.",
                            "tags": [
                              {
                                "name": "defaultValue",
                                "text": "'div'"
                              }
                            ],
                            "required": false,
                            "type": "any",
                            "schema": "any"
                          },
                          "text": {
                            "name": "text",
                            "global": false,
                            "description": "Display some text inside the chip.",
                            "tags": [],
                            "required": false,
                            "type": "string | number | undefined",
                            "schema": {
                              "kind": "enum",
                              "type": "string | number | undefined",
                              "schema": {
                                "0": "undefined",
                                "1": "string",
                                "2": "number"
                              }
                            }
                          },
                          "color": {
                            "name": "color",
                            "global": false,
                            "description": "",
                            "tags": [
                              {
                                "name": "defaultValue",
                                "text": "'primary'"
                              }
                            ],
                            "required": false,
                            "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
                            "schema": {
                              "kind": "enum",
                              "type": "\"error\" | \"primary\" | \"secondary\" | \"success\" | \"info\" | \"warning\" | \"neutral\" | undefined",
                              "schema": {
                                "0": "undefined",
                                "1": "\"error\"",
                                "2": "\"primary\"",
                                "3": "\"secondary\"",
                                "4": "\"success\"",
                                "5": "\"info\"",
                                "6": "\"warning\"",
                                "7": "\"neutral\""
                              }
                            }
                          },
                          "size": {
                            "name": "size",
                            "global": false,
                            "description": "",
                            "tags": [
                              {
                                "name": "defaultValue",
                                "text": "'md'"
                              }
                            ],
                            "required": false,
                            "type": "\"3xs\" | \"2xs\" | \"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | undefined",
                            "schema": "\"3xs\" | \"2xs\" | \"xs\" | \"sm\" | \"md\" | \"lg\" | \"xl\" | \"2xl\" | \"3xl\" | undefined"
                          },
                          "position": {
                            "name": "position",
                            "global": false,
                            "description": "The position of the chip.",
                            "tags": [
                              {
                                "name": "defaultValue",
                                "text": "'top-right'"
                              }
                            ],
                            "required": false,
                            "type": "\"top-right\" | \"bottom-right\" | \"top-left\" | \"bottom-left\" | undefined",
                            "schema": {
                              "kind": "enum",
                              "type": "\"top-right\" | \"bottom-right\" | \"top-left\" | \"bottom-left\" | undefined",
                              "schema": {
                                "0": "undefined",
                                "1": "\"top-right\"",
                                "2": "\"bottom-right\"",
                                "3": "\"top-left\"",
                                "4": "\"bottom-left\""
                              }
                            }
                          },
                          "inset": {
                            "name": "inset",
                            "global": false,
                            "description": "When `true`, keep the chip inside the component for rounded elements.",
                            "tags": [],
                            "required": false,
                            "type": "boolean | undefined",
                            "schema": {
                              "kind": "enum",
                              "type": "boolean | undefined",
                              "schema": {
                                "0": "undefined",
                                "1": "false",
                                "2": "true"
                              }
                            }
                          },
                          "standalone": {
                            "name": "standalone",
                            "global": false,
                            "description": "When `true`, render the chip relatively to the parent.",
                            "tags": [],
                            "required": false,
                            "type": "boolean | undefined",
                            "schema": "boolean | undefined"
                          },
                          "class": {
                            "name": "class",
                            "global": false,
                            "description": "",
                            "tags": [],
                            "required": false,
                            "type": "any",
                            "schema": "any"
                          },
                          "ui": {
                            "name": "ui",
                            "global": false,
                            "description": "",
                            "tags": [],
                            "required": false,
                            "type": "{ root?: ClassNameValue; base?: ClassNameValue; } | undefined",
                            "schema": {
                              "kind": "enum",
                              "type": "{ root?: ClassNameValue; base?: ClassNameValue; } | undefined",
                              "schema": {
                                "0": "undefined",
                                "1": "{ root?: ClassNameValue; base?: ClassNameValue; }"
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                "class": {
                  "name": "class",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "any",
                  "schema": "any"
                },
                "style": {
                  "name": "style",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "any",
                  "schema": "any"
                },
                "ui": {
                  "name": "ui",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "{ root?: ClassNameValue; image?: ClassNameValue; fallback?: ClassNameValue; icon?: ClassNameValue; } | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "{ root?: ClassNameValue; image?: ClassNameValue; fallback?: ClassNameValue; icon?: ClassNameValue; } | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "{ root?: ClassNameValue; image?: ClassNameValue; fallback?: ClassNameValue; icon?: ClassNameValue; }"
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        "name": "leading",
        "global": false,
        "description": "When `true`, the icon will be displayed on the left side.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "leadingIcon",
        "global": false,
        "description": "Display an icon on the left side.",
        "tags": [
          {
            "name": "IconifyIcon"
          }
        ],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "trailing",
        "global": false,
        "description": "When `true`, the icon will be displayed on the right side.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "trailingIcon",
        "global": false,
        "description": "Display an icon on the right side.",
        "tags": [
          {
            "name": "IconifyIcon"
          }
        ],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "loading",
        "global": false,
        "description": "When `true`, the loading icon will be displayed.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "loadingIcon",
        "global": false,
        "description": "The icon when the `loading` prop is `true`.",
        "tags": [
          {
            "name": "defaultValue",
            "text": "appConfig.ui.icons.loading"
          },
          {
            "name": "IconifyIcon"
          }
        ],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "type",
        "global": false,
        "description": "The type of the button when not a link.",
        "tags": [
          {
            "name": "defaultValue",
            "text": "'button'"
          }
        ],
        "required": false,
        "type": "\"reset\" | \"submit\" | \"button\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"reset\" | \"submit\" | \"button\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"reset\"",
            "2": "\"submit\"",
            "3": "\"button\""
          }
        }
      },
      {
        "name": "as",
        "global": false,
        "description": "The element or component this component should render as when not a link.",
        "tags": [
          {
            "name": "defaultValue",
            "text": "'button'"
          }
        ],
        "required": false,
        "type": "any",
        "schema": "any"
      },
      {
        "name": "to",
        "global": false,
        "description": "Route Location the link should navigate to when clicked on.",
        "tags": [],
        "required": false,
        "type": "string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined",
          "schema": {
            "0": "undefined",
            "1": "string",
            "2": {
              "kind": "object",
              "type": "RouteLocationAsRelativeGeneric",
              "schema": {
                "name": {
                  "name": "name",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "RouteRecordNameGeneric",
                  "schema": {
                    "kind": "enum",
                    "type": "RouteRecordNameGeneric",
                    "schema": {
                      "0": "undefined",
                      "1": "string",
                      "2": "symbol"
                    }
                  }
                },
                "params": {
                  "name": "params",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "RouteParamsRawGeneric | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "RouteParamsRawGeneric | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "RouteParamsRawGeneric"
                    }
                  }
                },
                "path": {
                  "name": "path",
                  "global": false,
                  "description": "A relative path to the current location. This property should be removed",
                  "tags": [],
                  "required": false,
                  "type": "undefined",
                  "schema": "undefined"
                },
                "query": {
                  "name": "query",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "LocationQueryRaw | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "LocationQueryRaw | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "LocationQueryRaw"
                    }
                  }
                },
                "hash": {
                  "name": "hash",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "string | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "string"
                    }
                  }
                },
                "replace": {
                  "name": "replace",
                  "global": false,
                  "description": "Replace the entry in the history instead of pushing a new entry",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "boolean | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "false",
                      "2": "true"
                    }
                  }
                },
                "force": {
                  "name": "force",
                  "global": false,
                  "description": "Triggers the navigation even if the location is the same as the current one.\r\nNote this will also add a new entry to the history unless `replace: true`\r\nis passed.",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "state": {
                  "name": "state",
                  "global": false,
                  "description": "State to save using the History API. This cannot contain any reactive\r\nvalues and some primitives like Symbols are forbidden. More info at\r\nhttps://developer.mozilla.org/en-US/docs/Web/API/History/state",
                  "tags": [],
                  "required": false,
                  "type": "HistoryState | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "HistoryState | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": {
                        "kind": "object",
                        "type": "HistoryState",
                        "schema": {}
                      }
                    }
                  }
                }
              }
            },
            "3": {
              "kind": "object",
              "type": "RouteLocationAsPathGeneric",
              "schema": {
                "path": {
                  "name": "path",
                  "global": false,
                  "description": "Percentage encoded pathname section of the URL.",
                  "tags": [],
                  "required": true,
                  "type": "string",
                  "schema": "string"
                },
                "query": {
                  "name": "query",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "LocationQueryRaw | undefined",
                  "schema": "LocationQueryRaw | undefined"
                },
                "hash": {
                  "name": "hash",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": "string | undefined"
                },
                "replace": {
                  "name": "replace",
                  "global": false,
                  "description": "Replace the entry in the history instead of pushing a new entry",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "force": {
                  "name": "force",
                  "global": false,
                  "description": "Triggers the navigation even if the location is the same as the current one.\r\nNote this will also add a new entry to the history unless `replace: true`\r\nis passed.",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "state": {
                  "name": "state",
                  "global": false,
                  "description": "State to save using the History API. This cannot contain any reactive\r\nvalues and some primitives like Symbols are forbidden. More info at\r\nhttps://developer.mozilla.org/en-US/docs/Web/API/History/state",
                  "tags": [],
                  "required": false,
                  "type": "HistoryState | undefined",
                  "schema": "HistoryState | undefined"
                }
              }
            }
          }
        }
      },
      {
        "name": "activeClass",
        "global": false,
        "description": "Class to apply when the link is active",
        "tags": [],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "exactActiveClass",
        "global": false,
        "description": "Class to apply when the link is exact active",
        "tags": [],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "ariaCurrentValue",
        "global": false,
        "description": "Value passed to the attribute `aria-current` when the link is exact active.",
        "tags": [
          {
            "name": "defaultValue",
            "text": "`'page'`"
          }
        ],
        "required": false,
        "type": "\"page\" | \"step\" | \"location\" | \"date\" | \"time\" | \"true\" | \"false\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"page\" | \"step\" | \"location\" | \"date\" | \"time\" | \"true\" | \"false\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"page\"",
            "2": "\"step\"",
            "3": "\"location\"",
            "4": "\"date\"",
            "5": "\"time\"",
            "6": "\"true\"",
            "7": "\"false\""
          }
        }
      },
      {
        "name": "viewTransition",
        "global": false,
        "description": "Pass the returned promise of `router.push()` to `document.startViewTransition()` if supported.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "replace",
        "global": false,
        "description": "Calls `router.replace` instead of `router.push`.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "disabled",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "active",
        "global": false,
        "description": "Force the link to be active independent of the current route.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "exact",
        "global": false,
        "description": "Will only be active if the current route is an exact match.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "exactQuery",
        "global": false,
        "description": "Allows controlling how the current route query sets the link as active.",
        "tags": [],
        "required": false,
        "type": "boolean | \"partial\" | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | \"partial\" | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true",
            "3": "\"partial\""
          }
        }
      },
      {
        "name": "exactHash",
        "global": false,
        "description": "Will only be active if the current route hash is an exact match.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "inactiveClass",
        "global": false,
        "description": "The class to apply when the link is inactive.",
        "tags": [],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "href",
        "global": false,
        "description": "An alias for `to`. If used with `to`, `href` will be ignored",
        "tags": [],
        "required": false,
        "type": "string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | RouteLocationAsRelativeGeneric | RouteLocationAsPathGeneric | undefined",
          "schema": {
            "0": "undefined",
            "1": "string",
            "2": {
              "kind": "object",
              "type": "RouteLocationAsRelativeGeneric",
              "schema": {
                "name": {
                  "name": "name",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "RouteRecordNameGeneric",
                  "schema": {
                    "kind": "enum",
                    "type": "RouteRecordNameGeneric",
                    "schema": {
                      "0": "undefined",
                      "1": "string",
                      "2": "symbol"
                    }
                  }
                },
                "params": {
                  "name": "params",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "RouteParamsRawGeneric | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "RouteParamsRawGeneric | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "RouteParamsRawGeneric"
                    }
                  }
                },
                "path": {
                  "name": "path",
                  "global": false,
                  "description": "A relative path to the current location. This property should be removed",
                  "tags": [],
                  "required": false,
                  "type": "undefined",
                  "schema": "undefined"
                },
                "query": {
                  "name": "query",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "LocationQueryRaw | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "LocationQueryRaw | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "LocationQueryRaw"
                    }
                  }
                },
                "hash": {
                  "name": "hash",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "string | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "string"
                    }
                  }
                },
                "replace": {
                  "name": "replace",
                  "global": false,
                  "description": "Replace the entry in the history instead of pushing a new entry",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "boolean | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": "false",
                      "2": "true"
                    }
                  }
                },
                "force": {
                  "name": "force",
                  "global": false,
                  "description": "Triggers the navigation even if the location is the same as the current one.\r\nNote this will also add a new entry to the history unless `replace: true`\r\nis passed.",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "state": {
                  "name": "state",
                  "global": false,
                  "description": "State to save using the History API. This cannot contain any reactive\r\nvalues and some primitives like Symbols are forbidden. More info at\r\nhttps://developer.mozilla.org/en-US/docs/Web/API/History/state",
                  "tags": [],
                  "required": false,
                  "type": "HistoryState | undefined",
                  "schema": {
                    "kind": "enum",
                    "type": "HistoryState | undefined",
                    "schema": {
                      "0": "undefined",
                      "1": {
                        "kind": "object",
                        "type": "HistoryState",
                        "schema": {}
                      }
                    }
                  }
                }
              }
            },
            "3": {
              "kind": "object",
              "type": "RouteLocationAsPathGeneric",
              "schema": {
                "path": {
                  "name": "path",
                  "global": false,
                  "description": "Percentage encoded pathname section of the URL.",
                  "tags": [],
                  "required": true,
                  "type": "string",
                  "schema": "string"
                },
                "query": {
                  "name": "query",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "LocationQueryRaw | undefined",
                  "schema": "LocationQueryRaw | undefined"
                },
                "hash": {
                  "name": "hash",
                  "global": false,
                  "description": "",
                  "tags": [],
                  "required": false,
                  "type": "string | undefined",
                  "schema": "string | undefined"
                },
                "replace": {
                  "name": "replace",
                  "global": false,
                  "description": "Replace the entry in the history instead of pushing a new entry",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "force": {
                  "name": "force",
                  "global": false,
                  "description": "Triggers the navigation even if the location is the same as the current one.\r\nNote this will also add a new entry to the history unless `replace: true`\r\nis passed.",
                  "tags": [],
                  "required": false,
                  "type": "boolean | undefined",
                  "schema": "boolean | undefined"
                },
                "state": {
                  "name": "state",
                  "global": false,
                  "description": "State to save using the History API. This cannot contain any reactive\r\nvalues and some primitives like Symbols are forbidden. More info at\r\nhttps://developer.mozilla.org/en-US/docs/Web/API/History/state",
                  "tags": [],
                  "required": false,
                  "type": "HistoryState | undefined",
                  "schema": "HistoryState | undefined"
                }
              }
            }
          }
        }
      },
      {
        "name": "external",
        "global": false,
        "description": "Forces the link to be considered as external (true) or internal (false). This is helpful to handle edge-cases",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "target",
        "global": false,
        "description": "Where to display the linked URL, as the name for a browsing context.",
        "tags": [],
        "required": false,
        "type": "\"_blank\" | \"_parent\" | \"_self\" | \"_top\" | (string & {}) | null | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"_blank\" | \"_parent\" | \"_self\" | \"_top\" | (string & {}) | null | undefined",
          "schema": {
            "0": "undefined",
            "1": "null",
            "2": "\"_blank\"",
            "3": "\"_parent\"",
            "4": "\"_self\"",
            "5": "\"_top\"",
            "6": {
              "kind": "object",
              "type": "string & {}",
              "schema": {}
            }
          }
        }
      },
      {
        "name": "rel",
        "global": false,
        "description": "A rel attribute value to apply on the link. Defaults to \"noopener noreferrer\" for external links.",
        "tags": [],
        "required": false,
        "type": "(string & {}) | \"noopener\" | \"noreferrer\" | \"nofollow\" | \"sponsored\" | \"ugc\" | null | undefined",
        "schema": {
          "kind": "enum",
          "type": "(string & {}) | \"noopener\" | \"noreferrer\" | \"nofollow\" | \"sponsored\" | \"ugc\" | null | undefined",
          "schema": {
            "0": "undefined",
            "1": "null",
            "2": {
              "kind": "object",
              "type": "string & {}",
              "schema": {}
            },
            "3": "\"noopener\"",
            "4": "\"noreferrer\"",
            "5": "\"nofollow\"",
            "6": "\"sponsored\"",
            "7": "\"ugc\""
          }
        }
      },
      {
        "name": "noRel",
        "global": false,
        "description": "If set to true, no rel attribute will be added to the link",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "prefetchedClass",
        "global": false,
        "description": "A class to apply to links that have been prefetched.",
        "tags": [],
        "required": false,
        "type": "string | undefined",
        "schema": {
          "kind": "enum",
          "type": "string | undefined",
          "schema": {
            "0": "undefined",
            "1": "string"
          }
        }
      },
      {
        "name": "prefetch",
        "global": false,
        "description": "When enabled will prefetch middleware, layouts and payloads of links in the viewport.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      },
      {
        "name": "prefetchOn",
        "global": false,
        "description": "Allows controlling when to prefetch links. By default, prefetch is triggered only on visibility.",
        "tags": [],
        "required": false,
        "type": "\"visibility\" | \"interaction\" | Partial<{ visibility: boolean; interaction: boolean; }> | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"visibility\" | \"interaction\" | Partial<{ visibility: boolean; interaction: boolean; }> | undefined",
          "schema": {
            "0": "undefined",
            "1": "\"visibility\"",
            "2": "\"interaction\"",
            "3": "Partial<{ visibility: boolean; interaction: boolean; }>"
          }
        }
      },
      {
        "name": "noPrefetch",
        "global": false,
        "description": "Escape hatch to disable `prefetch` attribute.",
        "tags": [],
        "required": false,
        "type": "boolean | undefined",
        "schema": {
          "kind": "enum",
          "type": "boolean | undefined",
          "schema": {
            "0": "undefined",
            "1": "false",
            "2": "true"
          }
        }
      }
    ]
    

    const jsonSchema = propsToJsonSchema(booleanEnumData as any)
    
    expect(jsonSchema.properties?.block).toEqual({
      type: 'boolean',
      description: 'Render the button full width.'
    })
  })

  test('should preserve complex TypeScript types as-is', () => {
    const complexTypeData = [
      {
        "name": "target",
        "global": false,
        "description": "Where to display the linked URL, as the name for a browsing context.",
        "tags": [],
        "required": false,
        "type": "\"_blank\" | \"_parent\" | \"_self\" | \"_top\" | (string & {}) | null | undefined",
        "schema": {
          "kind": "enum",
          "type": "\"_blank\" | \"_parent\" | \"_self\" | \"_top\" | (string & {}) | null | undefined",
          "schema": {
            "0": "undefined",
            "1": "null",
            "2": "\"_blank\"",
            "3": "\"_parent\"",
            "4": "\"_self\"",
            "5": "\"_top\"",
            "6": {
              "kind": "object",
              "type": "string & {}",
              "schema": {}
            }
          }
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(complexTypeData as any)
    
    expect(jsonSchema.properties?.target).toEqual({
      anyOf: [
        {
          enum: ["_blank", "_parent", "_self", "_top"]
        },
        {
          allOf: [
            { type: "string" },
            { type: "object", additionalProperties: false }
          ]
        }
      ],
      description: "Where to display the linked URL, as the name for a browsing context."
    })
  })

  test('should convert simple intersection types to allOf', () => {
    const simpleIntersectionData = [
      {
        "name": "customString",
        "global": false,
        "description": "A custom string type",
        "tags": [],
        "required": false,
        "type": "string & {}",
        "schema": {
          "kind": "object",
          "type": "string & {}",
          "schema": {}
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(simpleIntersectionData as any)
    
    expect(jsonSchema.properties?.customString).toEqual({
      allOf: [
        { type: "string" },
        { type: "object", additionalProperties: false }
      ],
      description: "A custom string type"
    })
  })

  test('should handle string | number | symbol union type', () => {
    const unionTypeData = [
      {
        "name": "activeColor",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "string | number | symbol",
        "schema": {
          "kind": "enum",
          "type": "string | number | symbol",
          "schema": {
            "0": "string",
            "1": "number",
            "2": "symbol"
          }
        }
      }
    ]

    const jsonSchema = propsToJsonSchema(unionTypeData as any)
    
    expect(jsonSchema.properties?.activeColor).toEqual({
      type: ["string", "number"] // symbol maps to string and gets deduplicated
    })
  })

  test('should handle string | number | symbol union type from string schema', () => {
    const unionTypeData = [
      {
        "name": "activeColor",
        "global": false,
        "description": "",
        "tags": [],
        "required": false,
        "type": "string | number | symbol",
        "schema": "string | number | symbol"
      }
    ]

    const jsonSchema = propsToJsonSchema(unionTypeData as any)
    
    expect(jsonSchema.properties?.activeColor).toEqual({
      type: ["string", "number"] // symbol maps to string in JSON Schema
    })
  })
})
