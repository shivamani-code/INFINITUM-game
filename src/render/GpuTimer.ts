import type { WebGLRenderer } from 'three';
/** Asynchronous timer queries; never wait on the GPU or call gl.finish(). */
export class GpuTimer {
  private gl: WebGL2RenderingContext;
  private ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private pending: WebGLQuery[] = []; private active?: WebGLQuery; private frame = 0;
  ms = 0;
  constructor(renderer: WebGLRenderer) { this.gl = renderer.getContext() as WebGL2RenderingContext; this.ext = this.gl.getExtension('EXT_disjoint_timer_query_webgl2'); }
  begin() {
    const gl=this.gl,ext=this.ext;if(!ext)return;
    if(gl.getParameter(ext.GPU_DISJOINT_EXT)){for(const q of this.pending)gl.deleteQuery(q);this.pending.length=0;this.ms=0;}
    while(this.pending.length && gl.getQueryParameter(this.pending[0],gl.QUERY_RESULT_AVAILABLE)) {
      const q=this.pending.shift()!;const ms=gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6;gl.deleteQuery(q);this.ms=this.ms?this.ms*.8+ms*.2:ms;
    }
    if(++this.frame%4===0 && this.pending.length<4){this.active=gl.createQuery()!;gl.beginQuery(ext.TIME_ELAPSED_EXT,this.active);}
  }
  end(){if(this.active){this.gl.endQuery(this.ext!.TIME_ELAPSED_EXT);this.pending.push(this.active);this.active=undefined;}}
}
