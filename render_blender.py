#!/usr/bin/env python3
"""
Blender Python script to render GLB models to JPEG images.
Can handle single model or multi-model grid layouts.
"""

import bpy
import sys
import os
import argparse
from pathlib import Path

def clear_scene():
    """Clear all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def setup_scene(output_width=1200, output_height=630, background_color=(0.992, 0.961, 0.902)):
    """Set up the scene with camera, lighting, and render settings."""
    clear_scene()
    
    # Set render settings
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.render.resolution_x = output_width
    scene.render.resolution_y = output_height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 95
    scene.render.film_transparent = False
    
    # Set background color (oldlace: #fdf5e6)
    world = scene.world
    if world is None:
        world = bpy.data.worlds.new("World")
        scene.world = world
    
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg is None:
        bg = world.node_tree.nodes.new('ShaderNodeBackground')
        world.node_tree.links.new(bg.outputs['Background'], world.node_tree.nodes['World Output'].inputs['Surface'])
    bg.inputs['Color'].default_value = (*background_color, 1.0)
    bg.inputs['Strength'].default_value = 1.0
    
    # Add camera with isometric orientation
    bpy.ops.object.camera_add(location=(5, -5, 5))
    camera = bpy.context.object
    # Isometric view: 54.736 degrees elevation (atan(sqrt(2))) and 45 degrees rotation
    camera.rotation_euler = (1.047, 0, 0.785)  # Isometric angle
    camera.data.type = 'ORTHO'  # Use orthographic projection for isometric view
    scene.camera = camera
    
    # Add lighting
    # Key light
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 10))
    key_light = bpy.context.object
    key_light.data.energy = 3.0
    key_light.rotation_euler = (0.785, 0, 0.785)
    
    # Fill light
    bpy.ops.object.light_add(type='SUN', location=(-3, -3, 5))
    fill_light = bpy.context.object
    fill_light.data.energy = 1.5
    fill_light.rotation_euler = (0.5, 0, -0.5)
    
    return scene, camera

def load_glb(filepath):
    """Load a GLB file and return the imported objects."""
    filepath = Path(filepath).resolve()
    if not filepath.exists():
        raise FileNotFoundError(f"Model file not found: {filepath}")
    
    # Import GLB
    bpy.ops.import_scene.gltf(filepath=str(filepath))
    
    # Get all imported objects
    imported_objects = [obj for obj in bpy.context.selected_objects]
    return imported_objects

def center_and_frame_objects(objects, camera, padding=1.0):
    """Center objects in the scene and frame the camera to fit them."""
    from mathutils import Vector
    
    if not objects:
        return
    
    # Calculate bounding box
    min_coords = [float('inf')] * 3
    max_coords = [float('-inf')] * 3
    has_meshes = False
    
    for obj in objects:
        if obj.type == 'MESH' and len(obj.bound_box) > 0:
            has_meshes = True
            # Get world matrix
            matrix_world = obj.matrix_world
            # Get bounding box corners
            for corner in obj.bound_box:
                world_corner = matrix_world @ Vector(corner)
                for i in range(3):
                    min_coords[i] = min(min_coords[i], world_corner[i])
                    max_coords[i] = max(max_coords[i], world_corner[i])
    
    # If no meshes found, use object locations as fallback
    if not has_meshes:
        for obj in objects:
            loc = obj.location
            for i in range(3):
                min_coords[i] = min(min_coords[i], loc[i])
                max_coords[i] = max(max_coords[i], loc[i])
    
    # Check if we have valid coordinates
    if min_coords[0] == float('inf'):
        # No valid objects, use default
        return
    
    # Calculate center
    center = [(min_coords[i] + max_coords[i]) / 2 for i in range(3)]
    
    # Move all objects to center at origin
    offset = Vector((-center[0], -center[1], -center[2]))
    for obj in objects:
        obj.location += offset
    
    # Calculate size
    size = max(max_coords[i] - min_coords[i] for i in range(3))
    
    # Position camera to frame the objects
    # Calculate appropriate distance based on bounding box
    if size > 0:
        distance = size * 2.0 + padding
    else:
        distance = 5.0  # Default distance if size calculation fails
    
    # Position camera for isometric view
    # Isometric: equal distance from all axes
    iso_distance = distance * 1.2
    camera.location = (iso_distance, -iso_distance, iso_distance)
    camera.rotation_euler = (1.047, 0, 0.785)  # Isometric angle (54.736° elevation, 45° rotation)
    camera.data.type = 'ORTHO'  # Ensure orthographic projection
    
    # Set camera to frame all objects (works in background mode)
    bpy.context.view_layer.objects.active = camera
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    
    # Try to frame selected, but if it fails (background mode), use manual calculation
    try:
        bpy.ops.view3d.camera_to_view_selected()
    except:
        # Fallback: manually adjust camera based on bounding box
        if size > 0:
            # Set camera distance to fit all objects
            # Set orthographic scale for isometric view
            camera.data.type = 'ORTHO'
            camera.data.ortho_scale = size * 2.5
            # Ensure isometric positioning
            iso_distance = distance * 1.2
            camera.location = (iso_distance, -iso_distance, iso_distance)
            camera.rotation_euler = (1.047, 0, 0.785)  # Isometric angle

def arrange_models_grid(objects, grid_cols=5, spacing=2.0):
    """Arrange multiple models in a grid layout."""
    if not objects:
        return
    
    # Group objects by model (assuming objects from same import are grouped)
    # For simplicity, we'll arrange them in a grid
    rows = (len(objects) + grid_cols - 1) // grid_cols
    
    for idx, obj in enumerate(objects):
        row = idx // grid_cols
        col = idx % grid_cols
        
        # Calculate position in grid
        x_offset = (col - (grid_cols - 1) / 2) * spacing
        z_offset = (rows - 1) / 2 - row * spacing
        
        obj.location.x += x_offset
        obj.location.z += z_offset

def render_single_model(model_path, output_path, output_width=1200, output_height=630):
    """Render a single GLB model."""
    scene, camera = setup_scene(output_width, output_height)
    
    # Load model
    objects = load_glb(model_path)
    
    # Center and frame
    center_and_frame_objects(objects, camera)
    
    # Render
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    
    print(f"✅ Rendered: {output_path}")

def render_multiple_models(model_paths, output_path, output_width=1200, output_height=630, grid_cols=5):
    """Render multiple GLB models in a grid layout."""
    scene, camera = setup_scene(output_width, output_height)
    
    all_objects = []
    
    # Load all models
    for model_path in model_paths:
        objects = load_glb(model_path)
        all_objects.extend(objects)
    
    if not all_objects:
        raise ValueError("No objects loaded from models")
    
    # Arrange in grid
    arrange_models_grid(all_objects, grid_cols=grid_cols)
    
    # Center and frame all objects
    center_and_frame_objects(all_objects, camera, padding=2.0)
    
    # Render
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    
    print(f"✅ Rendered: {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Render GLB models using Blender')
    parser.add_argument('--mode', choices=['single', 'multi'], required=True,
                       help='Render mode: single model or multiple models')
    parser.add_argument('--output', required=True,
                       help='Output JPEG file path')
    parser.add_argument('--width', type=int, default=1200,
                       help='Output width (default: 1200)')
    parser.add_argument('--height', type=int, default=630,
                       help='Output height (default: 630)')
    parser.add_argument('--grid-cols', type=int, default=5,
                       help='Number of columns for multi-model grid (default: 5)')
    parser.add_argument('models', nargs='+',
                       help='GLB model file paths')
    
    # Blender passes arguments after '--', so we need to parse from sys.argv
    # Find '--' separator
    if '--' in sys.argv:
        args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
    else:
        args = parser.parse_args()
    
    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        if args.mode == 'single':
            if len(args.models) != 1:
                raise ValueError("Single mode requires exactly one model")
            render_single_model(args.models[0], args.output, args.width, args.height)
        else:
            if len(args.models) < 1:
                raise ValueError("Multi mode requires at least one model")
            render_multiple_models(args.models, args.output, args.width, args.height, args.grid_cols)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
