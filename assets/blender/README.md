# INFINITUM modular production kit

Source: `build_kit.py`; editable Blender scene: `infinitum-kit.blend`.
Runtime export: `public/assets/models/infinitum-kit.glb` (1.48 MB, meshopt-compressed, including hero modules and LODs).

`preview_kit.py` creates the separate `infinitum-kit-preview.blend` gallery and renders `artifacts/blender-kit-gallery.png`. It evaluates source transforms before copying them from the authoring scene. Gallery placement never changes the GLB export origins.

Verified with Blender 5.2.1 LTS through MCP for initial creation/export, then the installed CLI after the MCP connection became unavailable. The original Blender scene was preserved. The build script operates only on the named INFINITUM_Kit scene.

Rebuild from PowerShell:

```powershell
& 'D:/project astra/blender.exe' --background --python 'D:/project astra/project/assets/blender/build_kit.py'
```

Authoring uses metres and Z up; GLTF export converts to Three.js Y up. Modules are centered horizontally at their base unless noted. The loader bakes node transforms, maps four material slots to shared runtime materials, and instances parts by module/material. Mesh names follow `module__Kit_Material`.

| Module | Nominal dimensions / origin | Current use |
| --- | --- | --- |
| monolith | 2 m core width, 15 m height; base origin | Chamber and city markers |
| tower | 9 m footprint, 60 m total crown height | Chamber buttresses and city skyline |
| hero_tower | Clustered nave with four separated spires, 90 m crown height | Central city landmark |
| wall_bay | 8.66 m width, 48 m height | Chamber facade and apse |
| arch | 8 m clear span, 13 m outside crown, 1.6 m depth | Chamber and city bridge vaults |
| ring | 10 m radius, centered origin, vertical | Chamber apse and city landmarks |
| portal | 4.2 m width, 6.25 m height | Chamber rear door |
| support | 8 m radius | Chamber sphere dais |
| platform | 8 m square, top at origin | Floating city fragments |
| panel | 3 m square, horizontal | Chamber and bridge floor insets |
| trim | 4 m length, centered origin | Chamber ledges and bridge edges |
| sentinel | approximately 2 m high, foot origin | Chamber sculptures |
| collision_monolith / collision_tower | Simplified boxes | Exported proxies; excluded from render loader |
| tower_lod / arch_lod / monolith_lod | Silhouette-preserving decimation | Distant city geometry |

Existing Rapier collision remains authoritative so this art pass does not alter puzzle routes. Proxy integration is reserved for future topology changes. Runtime transformations, gravity, perspective and Echo systems remain in Three.js.

Browser verification asserts imported monolith and tower instances exist. The visual test captures both upgraded areas. Full-route, reset and production tests protect behavior and resource lifetime.
