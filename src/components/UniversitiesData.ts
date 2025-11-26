export interface University {
  name: string
  description: string
  icon: 'shield' | 'target' | 'bridge' | 'book' | 'flask' | 'atom' | 'leaf' | 'building'
  courses: number
  website: string
  region: 'US' | 'Europe' | 'Asia' | 'MiddleEast'
}

export const universities: University[] = [
  {
    name: 'Massachusetts Institute of Technology (MIT)',
    description:
      'World-renowned for its computer science and engineering programs. MIT offers numerous free online courses through OpenCourseWare.',
    icon: 'shield',
    courses: 17,
    website: 'https://ocw.mit.edu',
    region: 'US'
  },
  {
    name: 'Stanford University',
    description:
      "Silicon Valley's premier university with exceptional computer science programs and free online course offerings.",
    icon: 'target',
    courses: 18,
    website: 'https://online.stanford.edu',
    region: 'US'
  },
  {
    name: 'University of California, Berkeley',
    description: 'Top public university with strong computer science programs and extensive free course offerings.',
    icon: 'bridge',
    courses: 14,
    website: 'https://online.berkeley.edu',
    region: 'US'
  },
  {
    name: 'Harvard University',
    description: 'Ivy League institution with comprehensive computer science education and free online learning resources.',
    icon: 'book',
    courses: 8,
    website: 'https://online-learning.harvard.edu',
    region: 'US'
  },
  {
    name: 'Carnegie Mellon University (CMU)',
    description: 'Leading computer science school known for robotics, AI, and software engineering excellence.',
    icon: 'flask',
    courses: 6,
    website: 'https://www.cs.cmu.edu',
    region: 'US'
  },
  {
    name: 'Princeton University',
    description: 'Ivy League research university with outstanding computer science department and online resources.',
    icon: 'shield',
    courses: 4,
    website: 'https://www.cs.princeton.edu',
    region: 'US'
  },
  {
    name: 'Cornell University',
    description: 'Ivy League institution with strong computer science programs and research opportunities.',
    icon: 'book',
    courses: 3,
    website: 'https://www.cs.cornell.edu',
    region: 'US'
  },
  {
    name: 'University of Michigan',
    description: 'Top-tier public university with comprehensive computer science curriculum and free online courses.',
    icon: 'shield',
    courses: 2,
    website: 'https://online.umich.edu',
    region: 'US'
  },
  {
    name: 'University of Wisconsin, Madison',
    description: 'Leading public research university with strong computer science programs and innovative teaching.',
    icon: 'leaf',
    courses: 2,
    website: 'https://www.cs.wisc.edu',
    region: 'US'
  },
  {
    name: 'University of Helsinki',
    description: "Finland's top university known for high-quality computer science education and innovative online courses.",
    icon: 'atom',
    courses: 2,
    website: 'https://www.helsinki.fi/en/computer-science',
    region: 'Europe'
  },
  {
    name: 'University of Cambridge',
    description: 'World-renowned British university with exceptional computer science programs and research.',
    icon: 'book',
    courses: 2,
    website: 'https://www.cam.ac.uk',
    region: 'Europe'
  },
  {
    name: 'ETH Zurich',
    description: 'Swiss Federal Institute of Technology, known for cutting-edge computer science research and education.',
    icon: 'flask',
    courses: 2,
    website: 'https://ethz.ch',
    region: 'Europe'
  },
  {
    name: 'Arizona State University',
    description: 'Innovative public university with strong computer science programs and online learning initiatives.',
    icon: 'building',
    courses: 2,
    website: 'https://www.asu.edu',
    region: 'US'
  },
  {
    name: 'Duke University',
    description: 'Prestigious private university with comprehensive computer science education and research.',
    icon: 'shield',
    courses: 1,
    website: 'https://www.duke.edu',
    region: 'US'
  },
  {
    name: 'KAIST',
    description: "Korea's top science and technology university with excellent computer science programs.",
    icon: 'target',
    courses: 3,
    website: 'https://www.kaist.ac.kr',
    region: 'Asia'
  },
  {
    name: 'Peking University',
    description: "China's top university with excellent computer science programs and research contributions.",
    icon: 'leaf',
    courses: 2,
    website: 'https://www.pku.edu.cn',
    region: 'Asia'
  },
  {
    name: 'University of Science and Technology of China (USTC)',
    description: 'Leading Chinese university known for strong science and technology programs, including computer science.',
    icon: 'atom',
    courses: 2,
    website: 'https://www.ustc.edu.cn',
    region: 'Asia'
  },
  {
    name: 'Nanjing University',
    description: 'Prestigious Chinese university with comprehensive computer science education and research.',
    icon: 'bridge',
    courses: 2,
    website: 'https://www.nju.edu.cn',
    region: 'Asia'
  },
  {
    name: 'National Taiwan University',
    description: "Taiwan's top university with excellent computer science programs and research initiatives.",
    icon: 'leaf',
    courses: 1,
    website: 'https://www.ntu.edu.tw',
    region: 'Asia'
  },
  {
    name: 'Shanghai Jiao Tong University',
    description: 'Leading Chinese university known for strong engineering and computer science programs.',
    icon: 'bridge',
    courses: 1,
    website: 'https://www.sjtu.edu.cn',
    region: 'Asia'
  },
  {
    name: 'Harbin Institute of Technology',
    description: "China's top engineering university with excellent computer science and technology programs.",
    icon: 'building',
    courses: 1,
    website: 'https://www.hit.edu.cn',
    region: 'Asia'
  },
  {
    name: 'University of Chinese Academy of Sciences',
    description: 'Premier research university in China, affiliated with the Chinese Academy of Sciences.',
    icon: 'atom',
    courses: 1,
    website: 'https://www.ucas.ac.cn',
    region: 'Asia'
  },
  {
    name: 'Hebrew University of Jerusalem',
    description: "Israel's leading university with strong computer science research and educational programs.",
    icon: 'building',
    courses: 1,
    website: 'https://www.huji.ac.il',
    region: 'MiddleEast'
  },
  {
    name: 'Amirkabir University of Technology',
    description: "Iran's top technical university with excellent computer science and engineering programs.",
    icon: 'flask',
    courses: 1,
    website: 'https://www.aut.ac.ir',
    region: 'MiddleEast'
  },
  {
    name: 'Syracuse University',
    description: 'Private research university with comprehensive computer science education and research opportunities.',
    icon: 'target',
    courses: 1,
    website: 'https://www.syracuse.edu',
    region: 'US'
  },
  {
    name: 'University of California, Santa Barbara (UCSB)',
    description: 'Top public research university with strong computer science programs and beautiful campus.',
    icon: 'bridge',
    courses: 2,
    website: 'https://www.ucsb.edu',
    region: 'US'
  }
]
