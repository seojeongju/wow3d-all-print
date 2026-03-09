import struct
import math

def generate_engine_rotor_stl(filename):
    # STL Header (80 bytes)
    header = b'\x00' * 80
    
    facets = []
    
    def add_triangle(p1, p2, p3):
        # Normal calculation
        v1 = [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]]
        v2 = [p3[0]-p1[0], p3[1]-p1[1], p3[2]-p1[2]]
        normal = [
            v1[1]*v2[2] - v1[2]*v2[1],
            v1[2]*v2[0] - v1[0]*v2[2],
            v1[0]*v2[1] - v1[1]*v2[0]
        ]
        length = math.sqrt(sum(x*x for x in normal))
        if length > 0:
            normal = [x/length for x in normal]
        else:
            normal = [0, 0, 0]
        
        facet = {
            'normal': normal,
            'v1': p1,
            'v2': p2,
            'v3': p3
        }
        facets.append(facet)

    # 1. Main Shaft (Cylinder)
    shaft_radius = 5.0
    shaft_length = 60.0
    segments = 24
    
    for i in range(segments):
        angle1 = 2 * math.pi * i / segments
        angle2 = 2 * math.pi * (i + 1) / segments
        
        x1, y1 = shaft_radius * math.cos(angle1), shaft_radius * math.sin(angle1)
        x2, y2 = shaft_radius * math.cos(angle2), shaft_radius * math.sin(angle2)
        
        # Side wall
        add_triangle((x1, y1, 0), (x2, y2, 0), (x1, y1, shaft_length))
        add_triangle((x2, y2, 0), (x2, y2, shaft_length), (x1, y1, shaft_length))
        
        # Caps
        add_triangle((0, 0, 0), (x2, y2, 0), (x1, y1, 0))
        add_triangle((0, 0, shaft_length), (x1, y1, shaft_length), (x2, y2, shaft_length))

    # 2. Fan Blades (Twisted Petals)
    num_blades = 12
    blade_length = 35.0
    blade_width = 12.0
    blade_thickness = 1.2
    
    for i in range(num_blades):
        base_angle = 2 * math.pi * i / num_blades
        
        # Blade points (simplified quad as two triangles)
        # Base points on shaft
        b1 = (shaft_radius * math.cos(base_angle), shaft_radius * math.sin(base_angle), 10)
        b2 = (shaft_radius * math.cos(base_angle), shaft_radius * math.sin(base_angle), 10 + blade_width)
        
        # Tip points (twisted and extended out)
        tip_angle = base_angle + 0.4 # Twist
        t1 = ((shaft_radius + blade_length) * math.cos(tip_angle), (shaft_radius + blade_length) * math.sin(tip_angle), 5)
        t2 = ((shaft_radius + blade_length) * math.cos(tip_angle), (shaft_radius + blade_length) * math.sin(tip_angle), 5 + blade_width)
        
        # Front face
        add_triangle(b1, t1, t2)
        add_triangle(b1, t2, b2)
        # Back face
        add_triangle(b1, t2, t1)
        add_triangle(b1, b2, t2)

    # 3. Nose Cone
    cone_radius = 6.0
    cone_height = 15.0
    for i in range(segments):
        angle1 = 2 * math.pi * i / segments
        angle2 = 2 * math.pi * (i + 1) / segments
        
        x1, y1 = cone_radius * math.cos(angle1), cone_radius * math.sin(angle1)
        x2, y2 = cone_radius * math.cos(angle2), cone_radius * math.sin(angle2)
        
        add_triangle((x1, y1, shaft_length), (x2, y2, shaft_length), (0, 0, shaft_length + cone_height))

    # Write Binary STL
    with open(filename, 'wb') as f:
        f.write(header)
        f.write(struct.pack('<I', len(facets)))
        for facet in facets:
            f.write(struct.pack('<fff', *facet['normal']))
            f.write(struct.pack('<fff', *facet['v1']))
            f.write(struct.pack('<fff', *facet['v2']))
            f.write(struct.pack('<fff', *facet['v3']))
            f.write(struct.pack('<H', 0))

if __name__ == "__main__":
    generate_engine_rotor_stl('d:/Documents/program_DEV/wow3d_all_print/public/jet_engine_rotor.stl')
    print("STL generated at public/jet_engine_rotor.stl")
