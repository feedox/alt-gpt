<script lang="ts">

export default {
	template: `<p
v-bind:innerHTML.prop="value"
contentEditable="true" 
@input="updateCode"
@keyup.ctrl.delete="$emit('delete-row')"
></p>`,
	props: ['value'],
	methods: {
		updateCode: function ($event) {
			//below code is a hack to prevent updateDomProps
			this.$vnode.child._vnode.data.domProps['innerHTML'] = $event.target.innerHTML;
			this.$emit('input', $event.target.innerHTML);
		}
	}
};

</script>
<style lang="less"></style>
